import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { CreateTaskDto, UpdateTaskDto, LABEL_CLIENT, LABEL_PATTERNS, AUTH_PATTERN, JwtDto, TEAM_PATTERN, USER_PATTERNS, MemberRole, GetTasksFilterDto, PROJECT_PATTERNS, Project, ListCategoryEnum, LIST_PATTERNS } from '@app/contracts';
import { Task } from '@app/contracts/task/entity/task.entity';
import { RabbitSubscribe, Nack, AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AUTH_EXCHANGE, CHATBOT_EXCHANGE, EVENTS_EXCHANGE, LABEL_EXCHANGE, LIST_CLIENT, LIST_EXCHANGE, PROJECT_CLIENT, RPC_TIMEOUT, TASK_EXCHANGE, TEAM_EXCHANGE, USER_EXCHANGE } from '@app/contracts/constants';
import { LabelEvent } from '@app/contracts/events/label.event';
import { Label } from '@app/contracts/label/entity/label.entity';
import { TaskLabel as TaskLabelEvent } from '@app/contracts/events/task-label.event';
import { TaskLabel } from '@app/contracts/task/entity/task-label.entity';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { unwrapRpcResult } from '@app/common';
import { List } from '@app/contracts/list/list/list.entity';

@Injectable()
export class TasksService {

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskLabel)
    private readonly taskLabelRepository: Repository<TaskLabel>,
    private readonly amqpConnection: AmqpConnection,
    @Inject(LABEL_CLIENT) private readonly labelClient: ClientProxy,
    @Inject(PROJECT_CLIENT) private readonly projectClient: ClientProxy,
    @Inject(LIST_CLIENT) private readonly listClient: ClientProxy,
  ) { }

  async getUserIdFromToken(token: string): Promise<string> {
    const response = await this.amqpConnection.request<JwtDto>({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
      payload: token,
      timeout: RPC_TIMEOUT,
    });
    return response.id;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { listId, position, labelIds, ...rest } = createTaskDto; //

    let newPosition = position;
    if (!newPosition) {
      const lastTask = await this.taskRepository.findOne({
        where: { listId },
        order: { position: 'DESC' }, // Lấy cái cao nhất
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
      console.log(rest)
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
    if (!taskIds.length) return;
    try {

      await this.taskRepository
        .createQueryBuilder()
        .delete()
        .from(Task)
        .where("id IN (:...ids)", { ids: taskIds })
        .andWhere("reporterId = :userId", { userId })
        .execute();
      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message);
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
      const labelsDetails = await lastValueFrom(
        this.labelClient.send<Label[]>(TaskLabelEvent.GET_DETAILS, { labelIds: allLabelIds })
      );

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

  async findAllByProject(userId: string, filters: GetTasksFilterDto) {
    console.log(filters)
    const project = await firstValueFrom(
      this.projectClient.send<Project>(PROJECT_PATTERNS.GET_BY_ID, { id: filters.projectId })
    );
    if (!project) throw new NotFoundException('Project not found');
    unwrapRpcResult(
      await this.amqpConnection.request({
        exchange: TEAM_EXCHANGE,
        routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
        payload: { userId, teamId: project.teamId, roles: [MemberRole.ADMIN, MemberRole.OWNER, MemberRole.MEMBER] },
      })
    )
    console.log("Filters received in getAllByProject: ", filters);
    const {
      projectId,
      search,
      assigneeIds,
      priority,
      statusId,
      epicId,
      labelIds,
      sprintId,
      parentId,
      page = 1,
      limit = 10,
    } = filters;

    const query = this.taskRepository.createQueryBuilder('task');
    query.leftJoinAndSelect('task.taskLabels', 'taskLabels');

    const shouldFetchSubtasks =
      (!search && (!assigneeIds || assigneeIds.length === 0) && parentId === undefined && sprintId === undefined) // shouldFetchSubtasks cũ
      || (parentId === null || parentId === 'null');

    query.where('task.projectId = :projectId', { projectId });

    if (shouldFetchSubtasks) {
      query.leftJoinAndSelect('task.children', 'children');
      query.leftJoinAndSelect('children.taskLabels', 'childLabels');
    } else {
      if (search) query.andWhere('task.title ILIKE :search', { search: `%${search}%` });
      if (assigneeIds && assigneeIds.length > 0) query.andWhere('task.assigneeIds && :assigneeIds', { assigneeIds });
    }

    console.log("Parents filter:", parentId, shouldFetchSubtasks);
    if (parentId === null || parentId === 'null') query.andWhere('task.parentId IS NULL');
    else if (parentId) query.andWhere('task.parentId = :parentId', { parentId });
    if (priority && priority.length > 0) query.andWhere('task.priority IN (:...priorities)', { priorities: priority });
    if (statusId) query.andWhere('task.listId IN (:...statusId) ', { statusId });
    if (epicId) query.andWhere('task.epicId IN (:...epicId)', { epicId });
    else if (epicId === null) query.andWhere('task.epicId IS NULL');
    if (Array.isArray(sprintId) && sprintId.length > 0) query.andWhere('task.sprintId IN (:...sprintId)', { sprintId });
    else if (sprintId === null) query.andWhere('task.sprintId IS NULL');

    if (labelIds && labelIds.length > 0) {
      query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('tl.taskId')
          .from('task_labels', 'tl')
          .where('tl.labelId IN (:...labelIds)')
          .getQuery();
        return 'task.id IN ' + subQuery;
      });
      query.setParameter('labelIds', labelIds);
    }

    query.orderBy('task.position', 'ASC');
    query.addOrderBy('task.createdAt', 'DESC');

    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const [results, total] = await query.getManyAndCount();

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
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }



  // task-service/src/tasks/tasks.service.ts

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<any> {
    const { labelIds, ...updates } = updateTaskDto;
    const task = await this.findOne(id);

    const updatedTask = this.taskRepository.merge(task, updates);
    await this.taskRepository.save(updatedTask);
    if (labelIds !== undefined) {
      console.log("labelIds while update ", labelIds)
      await this.assignLabels(id, labelIds);
      return this.findLabelsByTaskId(id)
    }
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return { success: true };
  }

  private async assignLabels(taskId: string, labelIds: string[]) {
    if (labelIds && labelIds.length > 0) {
      try {

        const labels = await lastValueFrom(
          this.labelClient.send<Label[]>(TaskLabelEvent.GET_DETAILS, { labelIds })
        );

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

  async moveIncompleteTasksToBacklog(
    sprintId: string,
    backlogStatusId: string,
  ) {
    // This method would be called when a sprint is completed.
    // It finds all tasks in the sprint that are not 'done' and moves them.
    // This requires knowing which status categories are considered "incomplete".
    // For simplicity, we assume anything not in the 'done' category is incomplete.
    // This logic would likely live in the sprint-service and call the task-service.
    // This is a placeholder for that interaction.
    return this.taskRepository.update(
      { sprintId /*, status: { category: Not('done') } */ },
      { sprintId: null, listId: backlogStatusId },
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




  async getAllTaskLabel(projectId: string) {
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

  async suggestTask(userId: string, objective: string, projectId: string, sprintId: string, teamId: string) {
    console.log("Sending AI request for user:", userId, "with objective:", objective, "team Id:", teamId);
    unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId, roles: [MemberRole.ADMIN, MemberRole.OWNER] },
      timeout: RPC_TIMEOUT,
    }))

    let members = []

    if (sprintId) {
      const response = await this.amqpConnection.request({
        exchange: TEAM_EXCHANGE,
        routingKey: TEAM_PATTERN.FIND_PARTICIPANTS_IDS,
        payload: teamId,
        timeout: RPC_TIMEOUT,
      });
      const memberIds = unwrapRpcResult(response);

      members = unwrapRpcResult(await this.amqpConnection.request({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.GET_BULK_SKILLS,
        payload: memberIds
      }))
    }

    await this.amqpConnection.publish(CHATBOT_EXCHANGE, 'suggest_task', {
      userId,
      objective,
      members,
    });
  }

  async getProjectStats(projectId: string, userId: string) {
    console.log(projectId, userId);
    const project = unwrapRpcResult(
      await firstValueFrom<Project>(this.projectClient.send<Project>(PROJECT_PATTERNS.GET_BY_ID, { id: projectId })
      ));

    unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId: project.teamId, roles: [MemberRole.ADMIN, MemberRole.OWNER] },
      timeout: RPC_TIMEOUT,
    }))

    const lists: List[] = unwrapRpcResult(
      await firstValueFrom<List[]>(
        this.listClient.send(LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID, { projectId })
      )
    )

    const doneListIds = lists
      .filter((l) => l.category === ListCategoryEnum.DONE)
      .map((l) => l.id);

    const doneIdsParam = doneListIds.length > 0 ? doneListIds : [null];

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0)).toISOString();

    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);
    const endOfNext7Days = next7Days.toISOString();

    const safeDoneIds = doneListIds.length > 0 ? doneListIds : [null];

    const [statsResult, distribution, activity] = await Promise.all([
      this.taskRepository
        .createQueryBuilder('task')
        .select([
          `SUM(CASE WHEN task.listId IN (:...doneIds) THEN 1 ELSE 0 END) ::int as completed`,
          `SUM(CASE WHEN task.listId NOT IN (:...doneIds) OR task.listId IS NULL THEN 1 ELSE 0 END) ::int as pending`,
          `SUM(CASE 
            WHEN (task.listId NOT IN (:...doneIds) OR task.listId IS NULL) 
            AND task.dueDate < :startOfToday 
            THEN 1 ELSE 0 
         END) ::int as overdue`,
          `SUM(CASE 
            WHEN (task.listId NOT IN (:...doneIds) OR task.listId IS NULL) 
            AND task.dueDate >= :startOfToday 
            AND task.dueDate <= :endOfNext7Days
            THEN 1 ELSE 0 
         END) ::int as "dueSoon"`,
        ])
        .where('task.projectId = :projectId', { projectId })
        .setParameters({
          doneIds: doneIdsParam,
          startOfToday,
          endOfNext7Days,
        })
        .getRawOne(),

      this.taskRepository
        .createQueryBuilder('task')
        .select('task.listId', 'listId')
        .addSelect('COUNT(task.id)', 'count')
        .where('task.projectId = :projectId', { projectId })
        .groupBy('task.listId')
        .getRawMany(),

      await this.taskRepository.query(
        `
      WITH dates AS (
        SELECT to_char(d, 'YYYY-MM-DD') as date_str
        FROM generate_series(NOW() - INTERVAL '6 days', NOW(), '1 day') as d
      ),
      created_counts AS (
        SELECT 
          to_char("createdAt", 'YYYY-MM-DD') as date_str, 
          COUNT(*) as count
        FROM tasks
        WHERE "projectId" = $1 
          AND "createdAt" >= NOW() - INTERVAL '6 days'
        GROUP BY 1
      ),
      completed_counts AS (
        SELECT 
          to_char("updatedAt", 'YYYY-MM-DD') as date_str, 
          COUNT(*) as count
        FROM tasks
        WHERE "projectId" = $1 
        AND "listId" = ANY($2) -- Cú pháp check array trong Postgres
          AND "updatedAt" >= NOW() - INTERVAL '6 days'
          GROUP BY 1
      )
      SELECT 
        dates.date_str as "date",
        COALESCE(created.count, 0)::int as "tasksCreated",
        COALESCE(completed.count, 0)::int as "tasksCompleted"
        FROM dates
      LEFT JOIN created_counts created ON dates.date_str = created.date_str
      LEFT JOIN completed_counts completed ON dates.date_str = completed.date_str
      ORDER BY dates.date_str ASC;
      `,
        [projectId, safeDoneIds]
      )
    ])

    return {
      stats: {
        completed: statsResult.completed || 0,
        pending: statsResult.pending || 0,
        overdue: statsResult.overdue || 0,
        dueSoon: statsResult.dueSoon || 0,
      },
      distribution,
      activity,
      lists,
    };
  }
}
