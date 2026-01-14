import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, SelectQueryBuilder, Not, Brackets, FindOptionsWhere } from 'typeorm';
import { CreateTaskDto, UpdateTaskDto, LABEL_CLIENT, LABEL_PATTERNS, AUTH_PATTERN, JwtDto, TEAM_PATTERN, USER_PATTERNS, MemberRole, PROJECT_PATTERNS, Project, ListCategoryEnum, LIST_PATTERNS, GetTasksByProjectDto, BaseTaskFilterDto, GetTasksByTeamDto, CHATBOT_PATTERN, MemberDto, Error, ApprovalStatus, ForbiddenException } from '@app/contracts';
import { Task } from '@app/contracts/task/entity/task.entity';
import { RabbitSubscribe, Nack, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AUTH_EXCHANGE, CHATBOT_EXCHANGE, EVENTS_EXCHANGE, LABEL_EXCHANGE, LIST_CLIENT, LIST_EXCHANGE, PROJECT_CLIENT, RPC_TIMEOUT, TASK_EXCHANGE, TEAM_EXCHANGE, USER_EXCHANGE } from '@app/contracts/constants';
import { LabelEvent } from '@app/contracts/events/label.event';
import { Label } from '@app/contracts/label/entity/label.entity';
import { TaskLabel as TaskLabelEvent } from '@app/contracts/events/task-label.event';
import { TaskLabel } from '@app/contracts/task/entity/task-label.entity';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { RmqClientService, } from '@app/common';
import { List } from '@app/contracts/list/list/list.entity';

@Injectable()
export class TasksService {

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
    private readonly amqpConnection: RmqClientService,
    @Inject(LABEL_CLIENT) private readonly labelClient: ClientProxy,
    @Inject(PROJECT_CLIENT) private readonly projectClient: ClientProxy,
    @Inject(LIST_CLIENT) private readonly listClient: ClientProxy,
  ) { }

  async getUserIdFromToken(token: string): Promise<string> {
    const response = await this.amqpConnection.request<JwtDto>({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
      payload: token,
    });
    return response.id;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { listId, position, labelIds, ...rest } = createTaskDto;

    let newPosition = position;
    if (!newPosition) {
      const lastTask = await this.taskRepository.findOne({
        where: { listId },
        order: { position: 'DESC' },
        select: ['position'],
      });
      newPosition = lastTask ? lastTask.position + 65535 : 65535;
    }


    const newTask = this.taskRepository.create({ ...rest, listId, position: newPosition });
    const savedTask = await this.taskRepository.save(newTask);

    if (labelIds) {
      await this.assignLabels(savedTask.id, labelIds);
    }

    return this.findOne(savedTask.id);
  }

  async createBulk(createTaskDtos: CreateTaskDto[]): Promise<Task[]> {
    if (!createTaskDtos || createTaskDtos.length === 0) return [];

    const listId = createTaskDtos[0].listId;

    const lastTask = await this.taskRepository.findOne({
      where: { listId },
      order: { position: 'DESC' },
      select: ['position'],
    });

    let currentPosition = lastTask ? lastTask.position : 0;

    const tasksToCreate = createTaskDtos.map((dto) => {
      const { labelIds, ...rest } = dto;
      currentPosition += 65535;
      return this.taskRepository.create({
        ...rest,
        position: currentPosition,
      });
    });

    const savedTasks = await this.taskRepository.save(tasksToCreate);

    const labelsToAssign: { taskId: string; labelIds: string[] }[] = savedTasks.map((task, index) => ({
      taskId: task.id,
      labelIds: createTaskDtos[index].labelIds || [],
    })).filter(item => item.labelIds.length > 0);

    if (labelsToAssign.length > 0) {
      await this.assignLabelsBulk(labelsToAssign);
    }

    return savedTasks;
  }

  async deleteMany(taskIds: string[], userId: string) {
    console.log('deleteMany called with:', { taskIds, userId });
    if (!taskIds || !taskIds.length) {
      console.log('No task IDs provided or empty array');
      return { success: true, deleted: 0 };
    }

    try {
      const firstTask = await this.taskRepository.findOne({
        where: { id: In(taskIds) }
      });

      if (!firstTask) {
        throw new NotFoundException('No tasks found to delete');
      }

      let project: Project;
      try {
        project = await firstValueFrom(
          this.projectClient.send<Project>(PROJECT_PATTERNS.GET_BY_ID, { id: firstTask.projectId })
        );
      } catch (err) {
        throw new BadRequestException('Could not verify project access');
      }

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      try {
        await this.amqpConnection.request({
          exchange: TEAM_EXCHANGE,
          routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
          payload: { userId, teamId: project.teamId, roles: [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER] },
        });
      } catch (err) {
        console.error('Permission verification failed:', err);
        throw new BadRequestException('You do not have permission to delete tasks in this project');
      }

      console.log('Executing delete for tasks:', taskIds);
      const result = await this.taskRepository
        .createQueryBuilder()
        .delete()
        .from(Task)
        .where("id IN (:...ids)", { ids: taskIds })
        .execute();

      console.log(`Deleted ${result.affected} tasks`);
      return { success: true, deleted: result.affected };
    } catch (error) {
      console.error('Error in deleteMany:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error?.message || 'Failed to delete tasks');
    }
  }

  async updateMany(taskIds: string[], updateTaskDto: UpdateTaskDto, userId: string) {
    if (!taskIds || taskIds.length === 0) {
      return { affected: 0 };
    }

    if (!updateTaskDto || Object.keys(updateTaskDto).length === 0) {
      console.warn('UpdateMany: No values to update', { taskIds });
      return { affected: 0 };
    }

    const result = await this.taskRepository.update(
      {
        id: In(taskIds),
        reporterId: userId
      },
      updateTaskDto
    );

    return result;
  }

  async assignLabelsBulk(tasksWithLabels: { taskId: string; labelIds: string[] }[]) {
    const allLabelIds = [...new Set(tasksWithLabels.flatMap(item => item.labelIds))];

    try {
      const labelsDetails = await this.amqpConnection.request<Label[]>({
        exchange: LABEL_EXCHANGE,
        routingKey: LABEL_PATTERNS.GET_DETAILS,
        payload: { ids: allLabelIds }
      });

      if (!labelsDetails || !Array.isArray(labelsDetails)) return;

      const labelMap = new Map(labelsDetails.map(l => [l.id, l]));

      const newLinks: Partial<TaskLabel>[] = [];

      tasksWithLabels.forEach(item => {
        item.labelIds.forEach(labelId => {
          const label = labelMap.get(labelId);
          if (label) {
            newLinks.push({
              taskId: item.taskId,
              labelId: label.id,
              name: label.name,
              color: label.color,
              projectId: label.projectId
            });
          }
        });
      });

      if (newLinks.length > 0) {
        await this.taskLabelRepository
          .createQueryBuilder()
          .insert()
          .into(TaskLabel)
          .values(newLinks)
          .orIgnore()
          .execute();
      }
    } catch (error) {
      console.error('Error in assignLabelsBulk:', error);
    }
  }

  async suggestTask(userId: string, objective: string, projectId: string, sprintId: string, teamId: string) {
    console.log("Sending AI request for user:", userId, "with objective:", objective, "team Id:", teamId);
    await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId, roles: [MemberRole.ADMIN, MemberRole.OWNER] },
    })

    let members = [];
    console.log("PERMISSION GRANTED")
    if (sprintId) {
      const memberIds = await this.amqpConnection.request<MemberDto[]>({
        exchange: TEAM_EXCHANGE,
        routingKey: TEAM_PATTERN.FIND_PARTICIPANTS_IDS,
        payload: teamId,
      });

      members = await this.amqpConnection.request({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.GET_BULK_SKILLS,
        payload: memberIds.map(m => m.id),
      })

      console.log("PERMISSION MEMBERS GRANTED")
    }

    await this.amqpConnection.publish(CHATBOT_EXCHANGE, 'suggest_task', {
      userId,
      objective,
      members
    });
  }


  async findAllByProject(userId: string, filters: GetTasksByProjectDto) {
    const project = await firstValueFrom(
      this.projectClient.send<Project>(PROJECT_PATTERNS.GET_BY_ID, { id: filters.projectId })
    );
    if (!project) throw new NotFoundException('Project not found');

    await this.verifyPermission(userId, project.teamId);

    const query = this.taskRepository.createQueryBuilder('task');
    query.where('task.projectId = :projectId', { projectId: filters.projectId });
    return this._getTasksCommon(query, filters, userId, filters.projectId, undefined);
  }

  async findAllByTeam(userId: string, filters: GetTasksByTeamDto) {
    await this.verifyPermission(userId, filters.teamId);

    const query = this.taskRepository.createQueryBuilder('task');
    query.where('task.teamId = :teamId', { teamId: filters.teamId });

    return this._getTasksCommon(query, filters, userId, undefined, filters.teamId);
  }

  private async verifyPermission(userId: string, teamId: string) {
    await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId, roles: [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER] },
    })
  }

  private async _getTasksCommon(query: SelectQueryBuilder<Task>, filters: BaseTaskFilterDto, userId: string, projectId?: string, teamId?: string) {
    const {
      search,
      assigneeIds,
      priority,
      statusId,
      epicId,
      labelIds,
      sprintId,
      parentId,
      isCompleted,
      sortBy,
      sortOrder,
      page = 1,
      limit = 10,
    } = filters;

    query.leftJoinAndSelect('task.taskLabels', 'taskLabels');

    let member: MemberDto | null = null;
    if (teamId) {
      member = await this.amqpConnection.request({
        exchange: TEAM_EXCHANGE,
        routingKey: TEAM_PATTERN.FIND_PARTICIPANTS,
        payload: { teamId, userId },
      })
      if (!member) throw new NotFoundException('Member not found');
    }

    console.log("UserId", userId, "TeamId", teamId, "Roles", member?.role);

    if (userId && member && member.role) {
      const isBacklogQuery = sprintId === null;
      const isSprintQuery = Array.isArray(sprintId) && sprintId.length > 0;
      if (isBacklogQuery) query.andWhere('task.reporterId = :userId', { userId });
      else if (isSprintQuery) {
        if (member.role === MemberRole.MEMBER)
          query.andWhere('task.assigneeIds @> ARRAY[:userId]::uuid[]', { userId });
      }
      else {
        if (member.role === MemberRole.MEMBER) {
          query.andWhere(
            new Brackets(qb => {
              qb.where('(task.sprintId IS NULL AND task.reporterId = :userId)', { userId })
                .orWhere('(task.sprintId IS NOT NULL AND task.assigneeIds @> ARRAY[:userId]::uuid[])', { userId });
            })
          );
        }
      }
    }

    let finalAllowedListIds: string[] = [];
    if (statusId && statusId.length > 0) {
      finalAllowedListIds = [...statusId];
    }

    if (isCompleted !== undefined) {
      let lists: List[] = [];
      const payload = projectId ? { projectId } : { teamId };
      const pattern = projectId ? LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID : LIST_PATTERNS.FIND_ALL_BY_TEAM;
      lists = await this.amqpConnection.request<List[]>({ exchange: LIST_EXCHANGE, routingKey: pattern, payload });
      const targetCategoryListIds = lists
        .filter(l => isCompleted ? l.category === ListCategoryEnum.DONE : l.category !== ListCategoryEnum.DONE)
        .map(l => l.id);

      if (finalAllowedListIds.length > 0) finalAllowedListIds = finalAllowedListIds.filter(id => targetCategoryListIds.includes(id));
      else finalAllowedListIds = targetCategoryListIds;
      if (finalAllowedListIds.length === 0) query.andWhere('1=0');
    } else {
      if (filters.statusId && filters.statusId.length > 0) {
        query.andWhere('task.listId IN (:...statusId) ', { statusId: filters.statusId });
      }
    }

    const isSearching = !!search || (assigneeIds && assigneeIds.length > 0);
    const isFetchingSpecificParent = parentId && parentId !== 'null';
    const isRootOnly = parentId === null;
    const shouldFetchSubtasks = !isSearching && !isFetchingSpecificParent && !sprintId && isRootOnly;

    if (shouldFetchSubtasks) {
      query.leftJoinAndSelect('task.children', 'children');
      query.leftJoinAndSelect('children.taskLabels', 'childLabels');
      query.andWhere('task.parentId IS NULL');
    } else {
      if (search) query.andWhere('task.title ILIKE :search', { search: `%${search}%` });
      if (assigneeIds && assigneeIds.length > 0) query.andWhere('task.assigneeIds && :assigneeIds', { assigneeIds });
      if (isRootOnly) query.andWhere('task.parentId IS NULL')
      else if (parentId) query.andWhere('task.parentId = :parentId', { parentId });
    }

    if (priority && priority.length > 0) query.andWhere('task.priority IN (:...priorities)', { priorities: priority });
    if (epicId) query.andWhere('task.epicId IN (:...epicId)', { epicId });
    else if (epicId === null) query.andWhere('task.epicId IS NULL');
    if (Array.isArray(sprintId) && sprintId.length > 0) query.andWhere('task.sprintId IN (:...sprintId)', { sprintId });
    else if (sprintId === null) query.andWhere('task.sprintId IS NULL');

    if (labelIds && labelIds.length > 0) {
      query.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('tl.taskId')
          .from('task_labels', 'tl')
          .where('tl.labelId IN (:...labelIds)')
          .getQuery();
        return 'task.id IN ' + subQuery;
      }).setParameter('labelIds', labelIds);
    }

    if (sortBy && sortBy.length > 0) {
      const sortMap = {
        'createdAt': 'task.createdAt',
        'updatedAt': 'task.updatedAt',
        'dueDate': 'task.dueDate',
        'startDate': 'task.startDate',
        'priority': 'task.priority',
        'title': 'task.title',
        'position': 'task.position'
      };

      console.log(sortBy)

      sortBy.forEach((sortItem, index) => {
        const [field, orderRaw] = sortItem.split(':');
        const order = (orderRaw || 'ASC').toUpperCase() as 'ASC' | 'DESC';
        const dbColumn = sortMap[field];
        if (dbColumn) index === 0 ? query.orderBy(dbColumn, order) : query.addOrderBy(dbColumn, order);
      });
    } else {
      query.orderBy('task.position', 'ASC');
      query.addOrderBy('task.createdAt', 'DESC');
    }

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [results, total] = await query.getManyAndCount();
    return this._formatTaskResponse(results, total, page, limit, shouldFetchSubtasks);
  }

  private _formatTaskResponse(results: Task[], total: number, page: number, limit: number, shouldFetchSubtasks: boolean) {
    let flatData: Task[] = [];

    if (shouldFetchSubtasks) {
      results.forEach(parent => {
        const { children, ...parentProps } = parent;
        flatData.push(parentProps as Task);

        if (children && children.length > 0) {
          children.sort((a, b) => a.position - b.position);
          children.forEach(child => {
            const childWithLabels = {
              ...child,
              taskLabels: (child as any).childLabels || []
            };
            delete (childWithLabels as any).childLabels;
            flatData.push(childWithLabels as Task);
          });
        }
      });
    } else {
      flatData = results;
    }

    return {
      data: flatData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }



  async findAllBySprint(sprintId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { sprintId },
      order: { position: 'ASC' },
    });
  }

  async findAllByList(listId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { listId },
      order: { position: 'ASC' },
    });
  }

  async findAllByReporter(reporterId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { reporterId },
      order: { position: 'ASC' },
    });
  }

  async findAllByBackLogs(projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { projectId, sprintId: IsNull() },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updatePayload: UpdateTaskDto, userId: string): Promise<any> {
    const task = await this.taskRepository.findOne({
      where: { id },
    });
    if (!task) throw new NotFoundException(`Task not found in this team`);

    const isAdminOrOwner = await this._isAdminOrOwner(task.teamId!, userId);
    if (!isAdminOrOwner) {
      if (updatePayload.approvalStatus !== undefined) throw new ForbiddenException("Only Owner/Admin can change approval status.");
      if (updatePayload.assigneeIds) throw new ForbiddenException("Members cannot change assignees.");
      if (task.approvalStatus !== ApprovalStatus.APPROVED) throw new ForbiddenException("Task must be approved before it can be edited.");
      const isReporter = task.reporterId === userId;
      const isAssignee = task.assigneeIds.includes(userId);
      if (!isReporter && !isAssignee) throw new ForbiddenException("You can only edit tasks you created or are assigned to.");
    }

    const { labelIds, ...updates } = updatePayload;
    this.taskRepository.merge(task, updates);
    await this.taskRepository.save(task);

    if (labelIds !== undefined) {
      await this.assignLabels(id, labelIds);
    }
    return this.findOne(id);
  }

  async remove(id: string, teamId: string, userId: string): Promise<{ success: boolean }> {
    const whereCondition: FindOptionsWhere<Task> = {
      id,
      teamId
    };

    const isAdminOrOwner = await this._isAdminOrOwner(teamId, userId);
    if (!isAdminOrOwner) {
      whereCondition.reporterId = userId;
      whereCondition.approvalStatus = In([
        ApprovalStatus.PENDING,
        ApprovalStatus.REJECTED
      ]);
    }
    const result = await this.taskRepository.delete(whereCondition);

    if (result.affected === 0) {
      throw new NotFoundException(
        'Task not found or you do not have permission to delete this task'
      );
    }
    return { success: true };
  }

  private async _isAdminOrOwner(teamId: string, userId: string): Promise<boolean> {
    const checkRole: Error = await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { teamId, userId, roles: [MemberRole.ADMIN, MemberRole.OWNER] },
    });
    return !checkRole?.error;
  }

  private async assignLabels(taskId: string, labelIds: string[]) {
    if (labelIds && labelIds.length > 0) {
      try {

        const labels = await this.amqpConnection.request({
          exchange: LABEL_EXCHANGE,
          routingKey: LABEL_PATTERNS.GET_DETAILS,
          payload: { labelIds },
        });

        console.log("labels------------ ", labels)

        if (labels && Array.isArray(labels) && labels.length > 0) {
          const newLinks = labels.map(label => {
            const link = new TaskLabel();
            link.taskId = taskId;
            link.labelId = label.id;
            link.name = label.name;
            link.projectId = label.projectId;
            link.color = label.color;
            return link;
          });


          await this.taskLabelRepository.save(newLinks);
        }
      } catch (error) {
        // Nếu RPC lỗi (Label Service chết), ta log lại nhưng KHÔNG crash flow tạo Task.
        // Task vẫn được tạo nhưng tạm thời không có label (Fail-safe).
        console.error('Error fetching label details via RPC:', error);
      }
    }
  }

  async findLabelsByTaskId(taskId: string): Promise<TaskLabel[]> {
    return this.taskLabelRepository.find({
      where: { taskId },
    });
  }

  async completeSprint(
    sprintId: string,
    projectId: string,
  ) {
    console.log("completeSprint", sprintId)
    const lists = await this.amqpConnection.request<List[]>({
      exchange: LIST_EXCHANGE,
      routingKey: LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId }
    });

    console.log("lists", lists)

    const completeList = lists.filter(l => l.category === ListCategoryEnum.DONE).map(l => l.id);
    const incompleteList = lists.filter(l => l.category === ListCategoryEnum.TODO).map(l => l.id);
    const completedTasks = await this.taskRepository.find({
      where: { sprintId, listId: In(completeList) },
    });

    const userSkillMap = new Map<string, { skillName: string; exp: number }[]>();
    for (const task of completedTasks) {
      if (!task.assigneeIds?.length) continue;

      for (const userId of task.assigneeIds) {
        console.log(userId)
        if (!task.skillName || !task.exp) continue;
        const currentSkills = userSkillMap.get(userId) || [];
        userSkillMap.set(userId, [...currentSkills, { skillName: task.skillName, exp: task.exp }]);
      }
    }

    console.log("userSkillMap", userSkillMap)

    const bulkPayload = Array.from(userSkillMap.entries()).map(([userId, skills]) => ({
      userId,
      skills
    }));

    console.log("bulkPayload", bulkPayload)

    if (bulkPayload.length > 0) {
      await this.amqpConnection.request({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.INCREMENT_BULK_SKILLS,
        payload: bulkPayload,
      })
    }

    return await this.moveIncompleteTasksToBacklog(sprintId, completeList, incompleteList[0]);
  }

  async moveIncompleteTasksToBacklog(
    sprintId: string,
    completeListIds: string[],
    targetListId: string,
  ) {
    return await this.taskRepository.update(
      {
        sprintId,
        listId: Not(In(completeListIds))
      },
      {
        sprintId: null,
        listId: targetListId
      },
    );
  }

  async unassignTasksFromSprint(sprintId: string) {
    return this.taskRepository.update({ sprintId }, { sprintId: null });
  }

  async handleLabelDeleted(payload: { id: string }) {
    try {
      await this.taskLabelRepository.delete({ labelId: payload.id });

      console.log(`Deleted relations for label ${payload.id}`);
    } catch (error) {
      console.error('Error handling label deleted:', error);
      return new Nack(true);
    }
  }

  async handLabelUpdate(label: Label) {
    try {
      await this.taskLabelRepository.update(
        { labelId: label.id },
        { name: label.name, color: label.color },
      );
    } catch (error) {
      return new Nack(true);
    }
  }

  async getAllTaskLabel(projectId: string, teamId: string, userId: string) {
    await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { teamId, userId, roles: [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER] },
    })

    try {
      return this.taskLabelRepository.find({
        where: { projectId },
      });
    }
    catch (error) {
      console.error('Error handling label deleted:', error);
      return new Nack(true);
    }
  }

  async addFiles(taskId: string, fileIds: string[]) {
    const task = await this.findOne(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const currentFiles = task.fileIds || [];
    const newFileIds = fileIds.filter(id => !currentFiles.includes(id));

    if (newFileIds.length > 0) {
      task.fileIds = [...currentFiles, ...newFileIds];
      await this.taskRepository.save(task);
    }

    return task;
  }

  async removeFile(taskId: string, fileId: string) {
    const task = await this.findOne(taskId);
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (task.fileIds && task.fileIds.includes(fileId)) {
      task.fileIds = task.fileIds.filter(id => id !== fileId);
      await this.taskRepository.save(task);
    }

    return task;
  }

  async getProjectStats(projectId: string, userId: string) {
    const lists = await firstValueFrom(
      this.listClient.send<List[]>(LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID, { projectId })
    );

    console.log("lists ", lists)

    const doneList = lists.find(l => l.category === ListCategoryEnum.DONE);
    console.log("doneList ", doneList);
    const doneListId = doneList?.id;

    const completed = doneListId
      ? await this.taskRepository.count({ where: { projectId, listId: doneListId } })
      : 0;

    console.log("doneListId ", doneListId)

    const pending = await this.taskRepository.count({
      where: { projectId, listId: doneListId ? In(lists.filter(l => l.id !== doneListId).map(l => l.id)) : In(lists.map(l => l.id)) }
    });

    const now = new Date();
    const overdue = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.dueDate < :now', { now })
      .andWhere(doneListId ? 'task.listId != :doneListId' : '1=1', { doneListId })
      .getCount();

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const dueSoon = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.dueDate BETWEEN :now AND :sevenDays', { now, sevenDays: sevenDaysFromNow })
      .andWhere(doneListId ? 'task.listId != :doneListId' : '1=1', { doneListId })
      .getCount();

    const distribution = await this.taskRepository
      .createQueryBuilder('task')
      .select('task.listId', 'listId')
      .addSelect('COUNT(task.id)', 'count')
      .where('task.projectId = :projectId', { projectId })
      .groupBy('task.listId')
      .getRawMany();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activity = await this.taskRepository
      .createQueryBuilder('task')
      .select('DATE(task.createdAt)', 'date')
      .addSelect('COUNT(task.id)', 'tasksCreated')
      .addSelect(
        doneListId
          ? `SUM(CASE WHEN task.listId = '${doneListId}' THEN 1 ELSE 0 END)`
          : '0',
        'tasksCompleted'
      )
      .where('task.projectId = :projectId', { projectId })
      .andWhere('task.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy('DATE(task.createdAt)')
      .orderBy('DATE(task.createdAt)', 'ASC')
      .getRawMany();

    return {
      stats: {
        completed,
        pending,
        overdue,
        dueSoon,
      },
      distribution,
      lists,
      activity: activity.map(a => ({
        date: a.date,
        tasksCreated: parseInt(a.tasksCreated || '0'),
        tasksCompleted: parseInt(a.tasksCompleted || '0'),
      })),
    };
  }
}
