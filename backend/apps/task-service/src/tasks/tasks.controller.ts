import { Body, Controller, Inject, Query, Req, Sse } from '@nestjs/common';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TASK_PATTERNS, EVENTS_EXCHANGE, Label, TASK_EXCHANGE, TEAM_EXCHANGE, GetTasksByProjectDto, GetTasksByTeamDto } from '@app/contracts';
import { customErrorHandler } from '@app/common';
import { LabelEvent } from '@app/contracts/events/label.event';
import { AiStreamService } from './ai-stream.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService,
    private readonly streamService: AiStreamService
  ) { }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.CREATE,
    queue: TASK_PATTERNS.CREATE,
    errorHandler: customErrorHandler,
  })
  create(createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.CREATE_MANY,
    queue: TASK_PATTERNS.CREATE_MANY,
    errorHandler: customErrorHandler,
  })
  createMany(createTaskDtos: CreateTaskDto[]) {
    return this.tasksService.createBulk(createTaskDtos);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.DELETE_MANY,
    queue: TASK_PATTERNS.DELETE_MANY,
    errorHandler: customErrorHandler,
  })
  findAll(body: { taskIds: string[]; userId: string, teamId: string }) {
    return this.tasksService.deleteMany(body.taskIds, body.userId, body.teamId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.FIND_ALL,
    queue: TASK_PATTERNS.FIND_ALL,
    errorHandler: customErrorHandler,
  })
  findAllByProject(payload: { userId: string, filters: GetTasksByProjectDto }) {
    return this.tasksService.findAllByProject(payload.userId, payload.filters);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.FIND_ALL_BY_TEAM_ID,
    queue: TASK_PATTERNS.FIND_ALL_BY_TEAM_ID,
    errorHandler: customErrorHandler,
  })
  findAllByTeam(payload: { userId: string, filters: GetTasksByTeamDto }) {
    return this.tasksService.findAllByTeam(payload.userId, payload.filters);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.GET_STATS,
    queue: TASK_PATTERNS.GET_STATS,
    errorHandler: customErrorHandler,
  })
  getStats(payload: { projectId: string, userId: string }) {
    return this.tasksService.getProjectStats(payload.projectId, payload.userId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.UPDATE_MANY,
    queue: TASK_PATTERNS.UPDATE_MANY,
    errorHandler: customErrorHandler,
  })
  updateMany(payload: { taskIds: string[]; updateTaskDto: UpdateTaskDto; userId: string, teamId: string }) {
    return this.tasksService.updateMany(payload.taskIds, payload.updateTaskDto, payload.userId, payload.teamId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.FIND_ONE,
    queue: TASK_PATTERNS.FIND_ONE,
    errorHandler: customErrorHandler,
  })
  findOne(payload: { id: string }) {
    return this.tasksService.findOne(payload.id);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.UPDATE,
    queue: TASK_PATTERNS.UPDATE,
    errorHandler: customErrorHandler,
  })
  update(payload: { id: string; updateTaskDto: UpdateTaskDto, userId: string }) {
    return this.tasksService.update(payload.id, payload.updateTaskDto, payload.userId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.REMOVE,
    queue: TASK_PATTERNS.REMOVE,
    errorHandler: customErrorHandler,
  })
  remove(payload: { id: string, userId: string, teamId: string }) {
    return this.tasksService.remove(payload.id, payload.teamId, payload.userId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.FIND_ALL_LABELS_BY_TASK_ID,
    queue: TASK_PATTERNS.FIND_ALL_LABELS_BY_TASK_ID,
    errorHandler: customErrorHandler,
  })
  findAllLabelsByTaskId(payload: { taskId: string }) {
    return this.tasksService.findLabelsByTaskId(payload.taskId);
  }

  // @RabbitRPC({
  //   exchange: TASK_EXCHANGE,
  //   routingKey: TASK_PATTERNS.MOVE_INCOMPLETE_TASKS_TO_BACKLOG,
  //   queue: TASK_PATTERNS.MOVE_INCOMPLETE_TASKS_TO_BACKLOG,
  //   errorHandler: customErrorHandler,
  // })
  // moveIncompleteTasksToBacklog(payload: { sprintId: string; backlogStatusId: string }) {
  //   return this.tasksService.moveIncompleteTasksToBacklog(
  //     payload.sprintId,
  //     payload.backlogStatusId,
  //   );
  // }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.COMPLETE_SPRINT,
    queue: TASK_PATTERNS.COMPLETE_SPRINT,
    errorHandler: customErrorHandler,
  })
  completeSprint(payload: { sprintId: string, projectId: string }) {
    return this.tasksService.completeSprint(payload.sprintId, payload.projectId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.UNASSIGN_TASKS_FROM_SPRINT,
    queue: TASK_PATTERNS.UNASSIGN_TASKS_FROM_SPRINT,
    errorHandler: customErrorHandler,
  })
  unassignTasksFromSprint(payload: { sprintId: string }) {
    return this.tasksService.unassignTasksFromSprint(payload.sprintId);
  }


  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.HANDLE_LABEL_DELETED,
    queue: TASK_PATTERNS.HANDLE_LABEL_DELETED,
    errorHandler: customErrorHandler,
  })
  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: LabelEvent.DELETED,
    queue: 'task-service.label.deleted',
  })
  async handleLabelDeleted(payload: { id: string }) {
    this.tasksService.handleLabelDeleted(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: LabelEvent.UPDATED,
    queue: 'task-service.label.updated',
  })
  async handleLabelUpdated(label: Label) {
    console.log("label update in tasks----------------", label)
    return this.tasksService.handLabelUpdate(label)
  }


  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.GET_ALL_TASK_LABEL,
    queue: TASK_PATTERNS.GET_ALL_TASK_LABEL,
    errorHandler: customErrorHandler,
  })
  getAllTaskLabel(payload: { projectId: string, teamId: string, userId: string }) {
    return this.tasksService.getAllTaskLabel(payload.projectId, payload.teamId, payload.userId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.REMOVE_FILE,
    queue: TASK_PATTERNS.REMOVE_FILE,
    errorHandler: customErrorHandler,
  })
  removeFile(payload: { taskId: string; fileId: string, userId: string }) {
    return this.tasksService.removeFile(payload.taskId, payload.fileId);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.ADD_FILES,
    queue: TASK_PATTERNS.ADD_FILES,
    errorHandler: customErrorHandler,
  })
  addFiles(payload: { taskId: string; fileIds: string[], userId: string }) {
    return this.tasksService.addFiles(payload.taskId, payload.fileIds);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.SUGGEST_TASK,
    queue: TASK_PATTERNS.SUGGEST_TASK,
    errorHandler: customErrorHandler,
  })
  suggestTask(payload: { userId: string, query: string; projectId: string; teamId: string, sprintId: string }) {
    return this.tasksService.suggestTask(payload.userId, payload.query, payload.projectId, payload.sprintId, payload.teamId);
  }

}