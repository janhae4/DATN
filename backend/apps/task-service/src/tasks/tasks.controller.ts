import { Controller } from '@nestjs/common';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TASK_PATTERNS, EVENTS_EXCHANGE, Label, TASK_EXCHANGE } from '@app/contracts';
import { customErrorHandler } from '@app/common';
import { LabelEvent } from '@app/contracts/events/label.event';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) { }

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
    routingKey: TASK_PATTERNS.FIND_ALL,
    queue: TASK_PATTERNS.FIND_ALL,
    errorHandler: customErrorHandler,
  })
  findAllByProject(payload: { projectId: string }) {
    return this.tasksService.findAllByProject(payload.projectId);
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
  update(payload: { id: string; updateTaskDto: UpdateTaskDto }) {
    return this.tasksService.update(payload.id, payload.updateTaskDto);
  }

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.REMOVE,
    queue: TASK_PATTERNS.REMOVE,
    errorHandler: customErrorHandler,
  })
  remove(payload: { id: string }) {
    return this.tasksService.remove(payload.id);
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

  @RabbitRPC({
    exchange: TASK_EXCHANGE,
    routingKey: TASK_PATTERNS.MOVE_INCOMPLETE_TASKS_TO_BACKLOG,
    queue: TASK_PATTERNS.MOVE_INCOMPLETE_TASKS_TO_BACKLOG,
    errorHandler: customErrorHandler,
  })
  moveIncompleteTasksToBacklog(payload: { sprintId: string; backlogStatusId: string }) {
    return this.tasksService.moveIncompleteTasksToBacklog(
      payload.sprintId,
      payload.backlogStatusId,
    );
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
  getAllTaskLabel(payload: { projectId: string }){
    return this.tasksService.getAllTaskLabel(payload.projectId);
  }
  
}