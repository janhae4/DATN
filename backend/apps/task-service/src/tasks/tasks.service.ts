import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, SelectQueryBuilder, Not, Brackets, FindOptionsWhere } from 'typeorm';
import { CreateTaskDto, UpdateTaskDto, LABEL_PATTERNS, AUTH_PATTERN, JwtDto, TEAM_PATTERN, USER_PATTERNS, MemberRole, PROJECT_PATTERNS, Project, ListCategoryEnum, LIST_PATTERNS, BaseTaskFilterDto, MemberDto, Error, ApprovalStatus, ForbiddenException, NotificationType, SendTeamNotificationDto, TASK_PATTERNS, SendTaskNotificationDto, TeamMember, User } from '@app/contracts';
import { Task } from '@app/contracts/task/entity/task.entity';
import { Nack } from '@golevelup/nestjs-rabbitmq';
import { AUTH_EXCHANGE, CHATBOT_EXCHANGE, LABEL_EXCHANGE, LIST_EXCHANGE, PROJECT_EXCHANGE, SOCKET_EXCHANGE, TEAM_EXCHANGE, USER_EXCHANGE } from '@app/contracts/constants';
import { Label } from '@app/contracts/label/entity/label.entity';
import { TaskLabel } from '@app/contracts/task/entity/task-label.entity';
import { RmqClientService, } from '@app/common';
import { List } from '@app/contracts/list/list/list.entity';
import { UpdateResult } from 'typeorm/browser';

@Injectable()
export class TasksService {

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
    private readonly amqpConnection: RmqClientService,
  ) { }

  private async _sendTaskNotification(payload: SendTaskNotificationDto) {
    await this.amqpConnection.publish(
      SOCKET_EXCHANGE,
      TASK_PATTERNS.SEND_NOTIFICATION,
      payload
    )
  }

  async getUserIdFromToken(token: string): Promise<string> {
    const response = await this.amqpConnection.request<JwtDto>({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
      payload: token,
    });
    return response.id;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { listId, position, labelIds, reporterId, teamId, ...rest } = createTaskDto;

    let newPosition = position;
    if (!newPosition) {
      const lastTask = await this.taskRepository.findOne({
        where: { listId },
        order: { position: 'DESC' },
        select: ['position'],
      });
      newPosition = lastTask ? lastTask.position + 65535 : 65535;
    }

    let approvalStatus = ApprovalStatus.PENDING;
    const reporter = await this.amqpConnection.request<MemberDto>({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
      payload: { userId: reporterId, teamId }
    })

    if (!reporter) throw new NotFoundException('Reporter not found');

    if ([MemberRole.ADMIN, MemberRole.OWNER].includes(reporter.role as MemberRole)) approvalStatus = ApprovalStatus.APPROVED;
    else approvalStatus = ApprovalStatus.PENDING

    const newTask = this.taskRepository.create({ ...rest, listId, position: newPosition, teamId, approvalStatus, reporterId });
    const savedTask = await this.taskRepository.save(newTask);

    this._sendTaskNotification({
      action: 'CREATE',
      taskIds: [savedTask.id],
      teamId: savedTask.teamId || '',
      actor: {
        ...reporter,
        id: reporterId || ''
      },
      details: {
        taskTitle: savedTask.title,
        newStatus: savedTask.approvalStatus
      },
      timeStamp: new Date(),
    })

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

    let approvalStatus = ApprovalStatus.PENDING;
    const reporter = await this.amqpConnection.request<MemberDto>({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
      payload: { userId: createTaskDtos[0].reporterId, teamId: createTaskDtos[0].teamId }
    })
    if (!reporter) throw new NotFoundException('Reporter not found');
    if ([MemberRole.ADMIN, MemberRole.OWNER].includes(reporter.role as MemberRole)) approvalStatus = ApprovalStatus.APPROVED;
    else approvalStatus = ApprovalStatus.PENDING


    const tasksToCreate = createTaskDtos.map((dto) => {
      const { labelIds, ...rest } = dto;
      currentPosition += 65535;
      return this.taskRepository.create({
        ...rest,
        position: currentPosition,
        reporterId: dto.reporterId,
        approvalStatus
      });
    });

    const savedTasks = await this.taskRepository.save(tasksToCreate);

    const count = savedTasks.length;
    let summaryTitle = '';

    if (count === 1) {
      summaryTitle = savedTasks[0].title;
    } else {
      summaryTitle = `${count} tasks (starting with "${savedTasks[0].title}")`;
    }

    this._sendTaskNotification({
      action: 'CREATE',
      taskIds: savedTasks.map(task => task.id),
      teamId: savedTasks[0].teamId || '',
      actor: {
        ...reporter,
        id: reporter.id || ''
      },
      details: {
        taskTitle: summaryTitle,
        newStatus: approvalStatus
      },
      timeStamp: new Date(),
    })

    const labelsToAssign: { taskId: string; labelIds: string[] }[] = savedTasks.map((task, index) => ({
      taskId: task.id,
      labelIds: createTaskDtos[index].labelIds || [],
    })).filter(item => item.labelIds.length > 0);

    if (labelsToAssign.length > 0) {
      await this.assignLabelsBulk(labelsToAssign);
    }

    return savedTasks;
  }

  async deleteMany(taskIds: string[], teamId: string, userId: string) {
    if (!taskIds || !taskIds.length) return { success: true, deleted: 0 };

    const member = await this.amqpConnection.request<MemberDto>({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
      payload: { teamId, userId },
    });
    if (!member) throw new NotFoundException(`You are not a member of this team.`);

    const queryFind = this.taskRepository.createQueryBuilder('task')
      .where("task.id IN (:...ids)", { ids: taskIds })
      .select(['task.id', 'task.title', 'task.reporterId']);

    if (member.role === MemberRole.MEMBER) {
      queryFind.andWhere("task.approvalStatus = :status", { status: 'PENDING' });
      queryFind.andWhere("task.reporterId = :userId", { userId });
    }

    const tasksToDelete = await queryFind.getMany();

    if (tasksToDelete.length === 0) return { success: true, deleted: 0 };

    const idsToDelete = tasksToDelete.map(t => t.id);
    await this.taskRepository.delete(idsToDelete);

    this._sendTaskNotification({
      action: 'DELETE',
      taskIds: idsToDelete,
      teamId: teamId,
      actor: member,
      details: {
        taskTitle: tasksToDelete.length === 1 ? tasksToDelete[0].title : `${tasksToDelete.length} tasks`,
      },
      timeStamp: new Date()
    });

    return { success: true, deleted: idsToDelete.length };
  }

  async updateMany(taskIds: string[], updateTaskDto: UpdateTaskDto, userId: string, teamId: string) {
    if (!taskIds?.length || !updateTaskDto || Object.keys(updateTaskDto).length === 0) {
      return { affected: 0 };
    }
    const member = await this.amqpConnection.request<MemberDto>({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
      payload: { teamId, userId },
    })
    if (!member) throw new BadRequestException('User not in team');

    const isHighLevel = [MemberRole.ADMIN, MemberRole.OWNER].includes(member.role as MemberRole);

    let cleanDto = { ...updateTaskDto };

    if (!isHighLevel) {
      delete cleanDto.approvalStatus;
      delete cleanDto.assigneeIds;
    }

    if (Object.keys(cleanDto).length === 0) return { affected: 0 };

    const queryBuilder = this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set(cleanDto)
      .where("id IN (:...ids)", { ids: taskIds });

    if (!isHighLevel) {
      queryBuilder.andWhere("approvalStatus = :status", { status: 'PENDING' });
      queryBuilder.andWhere("reporterId = :userId", { userId });
    }

    const response: UpdateResult = await queryBuilder.execute();

    if (response.affected || 0 > 0 && cleanDto.approvalStatus !== undefined) {
      const newStatus = cleanDto.approvalStatus;
      console.log("NEW STATUS", newStatus)
      const updatedTasks = await this.taskRepository.find({
        where: { id: In(taskIds) },
        select: ['id', 'title', 'reporterId', 'teamId']
      });


      if (updatedTasks.length > 0) {
        console.log(`📡 Sending update notification for ${updatedTasks.length} task(s)`);
        this._sendTaskNotification({
          action: newStatus === 'APPROVED' ? 'APPROVED' : 'REJECTED',
          taskIds: updatedTasks.map(t => t.id),
          teamId: teamId,
          actor: member,
          details: {
            taskTitle: updatedTasks.length === 1 ? updatedTasks[0].title : `${updatedTasks.length} tasks`,
            newStatus: newStatus
          },
          timeStamp: new Date()
        });
      }
    }

    return response
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
    await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId, roles: [MemberRole.ADMIN, MemberRole.OWNER] },
    })

    let members = [];
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
    }

    await this.amqpConnection.publish(CHATBOT_EXCHANGE, 'suggest_task', {
      userId,
      objective,
      members
    });
  }

  async findAllByProject(userId: string, filters: BaseTaskFilterDto) {
    const project = await this.amqpConnection.request<Project>({
      exchange: PROJECT_EXCHANGE,
      routingKey: PROJECT_PATTERNS.GET_BY_ID,
      payload: { id: filters.projectId },

    })
    if (!project) throw new NotFoundException('Project not found');

    await this.verifyPermission(userId, project.teamId);

    const query = this.taskRepository.createQueryBuilder('task');
    query.where('task.projectId = :projectId', { projectId: filters.projectId });
    return this._getTasksCommon(query, filters, userId, filters.projectId, filters.teamId);
  }

  async findAllByTeam(userId: string, filters: BaseTaskFilterDto) {
    await this.verifyPermission(userId, filters.teamId);
    console.log('filters', filters)
    const query = this.taskRepository.createQueryBuilder('task');
    query.where('task.teamId = :teamId', { teamId: filters.teamId });

    return this._getTasksCommon(query, filters, userId, undefined, filters.teamId);
  }

  private async verifyPermission(userId: string, teamId: string, roles: MemberRole[] = [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER]) {
    await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId, roles },
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
        routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
        payload: { teamId, userId },
      })
    }

    if (!member) throw new NotFoundException('Member not found');

    if (member.role === MemberRole.MEMBER) {
      query.andWhere(new Brackets(qb => {
        qb.where('task.approvalStatus = :approved', { approved: ApprovalStatus.APPROVED })
          .orWhere('task.reporterId = :userId', { userId })
          .orWhere('task.assigneeIds @> ARRAY[:userId]::uuid[]', { userId });
      }));
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
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) throw new NotFoundException(`Task not found in this team`);

    const member = await this.amqpConnection.request<MemberDto>({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
      payload: { userId, teamId: task.teamId }
    });
    if (!member) throw new ForbiddenException("Member not found");

    const isAdminOrOwner = [MemberRole.ADMIN, MemberRole.OWNER].includes(member.role as MemberRole);

    if (!isAdminOrOwner) {
      if (updatePayload.approvalStatus !== undefined) throw new ForbiddenException("Only Owner/Admin can change approval status.");
      if (updatePayload.assigneeIds) throw new ForbiddenException("Members cannot change assignees.");

      if (task.approvalStatus !== ApprovalStatus.APPROVED) throw new ForbiddenException("Task must be approved before it can be edited.");

      const isReporter = task.reporterId === userId;
      const isAssignee = task.assigneeIds.includes(userId);
      if (!isReporter && !isAssignee) throw new ForbiddenException("You can only edit tasks you created or are assigned to.");
    }

    const { labelIds, ...updates } = updatePayload;

    const oldStatus = task.approvalStatus;

    this.taskRepository.merge(task, updates);
    const savedTask = await this.taskRepository.save(task);

    if (labelIds !== undefined) {
      await this.assignLabels(id, labelIds);
    }

    let actionType: 'UPDATE' | 'APPROVED' | 'REJECTED' = 'UPDATE';

    if (updates.approvalStatus && updates.approvalStatus !== oldStatus) {
      actionType = updates.approvalStatus === ApprovalStatus.APPROVED ? 'APPROVED' : 'REJECTED';
    }

    this._sendTaskNotification({
      action: actionType,
      taskIds: [savedTask.id],
      teamId: savedTask.teamId || '',
      actor: member,
      details: {
        taskTitle: savedTask.title,
        updatedFields: Object.keys(updates),
        newStatus: savedTask.approvalStatus
      },
      timeStamp: new Date(),
    });

    return this.findOne(id);
  }

  async remove(id: string, teamId: string, userId: string): Promise<{ success: boolean }> {
    const member = await this.amqpConnection.request<MemberDto>({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
      payload: { userId, teamId }
    });
    if (!member) throw new ForbiddenException("Member not found");

    const isAdminOrOwner = [MemberRole.ADMIN, MemberRole.OWNER].includes(member.role as MemberRole);

    const whereCondition: FindOptionsWhere<Task> = { id, teamId };

    if (!isAdminOrOwner) {
      whereCondition.reporterId = userId;
      whereCondition.approvalStatus = In([ApprovalStatus.PENDING, ApprovalStatus.REJECTED]);
    }

    const taskToDelete = await this.taskRepository.findOne({ where: whereCondition });

    if (!taskToDelete) {
      throw new NotFoundException('Task not found or you do not have permission to delete this task');
    }

    await this.taskRepository.delete(id);

    this._sendTaskNotification({
      action: 'DELETE',
      taskIds: [id],
      teamId: teamId,
      actor: {
        ...member,
        id: userId
      },
      details: {
        taskTitle: taskToDelete.title,
      },
      timeStamp: new Date(),
    });

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
    const lists = await this.amqpConnection.request<List[]>({
      exchange: LIST_EXCHANGE,
      routingKey: LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId }
    });

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
