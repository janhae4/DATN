import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TASK_PATTERNS } from '@app/contracts';
import { customErrorHandler } from '@app/common';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @RabbitRPC({
    exchange: 'task_exchange',
    routingKey: TASK_PATTERNS.CREATE,
    queue: TASK_PATTERNS.CREATE,
    errorHandler: customErrorHandler,
  })
  create(createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @RabbitRPC({
    exchange: 'task_exchange',
    routingKey: TASK_PATTERNS.FIND_ALL,
    queue: TASK_PATTERNS.FIND_ALL,
    errorHandler: customErrorHandler,
  })
  findAllByProject(payload: { projectId: string }) {
    return this.tasksService.findAllByProject(payload.projectId);
  }

  @RabbitRPC({
    exchange: 'task_exchange',
    routingKey: TASK_PATTERNS.FIND_ONE,
    queue: TASK_PATTERNS.FIND_ONE,
    errorHandler: customErrorHandler,
  })
  findOne(payload: { id: string }) {
    return this.tasksService.findOne(payload.id);
  }

  @RabbitRPC({
    exchange: 'task_exchange',
    routingKey: TASK_PATTERNS.UPDATE,
    queue: TASK_PATTERNS.UPDATE,
    errorHandler: customErrorHandler,
  })
  update(payload: { id: string; updateTaskDto: UpdateTaskDto }) {
    return this.tasksService.update(payload.id, payload.updateTaskDto);
  }

  @RabbitRPC({
    exchange: 'task_exchange',
    routingKey: TASK_PATTERNS.REMOVE,
    queue: TASK_PATTERNS.REMOVE,
    errorHandler: customErrorHandler,
  })
  remove(payload: { id: string }) {
    return this.tasksService.remove(payload.id);
  }

  @RabbitRPC({
    exchange: 'task_exchange',
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
    exchange: 'task_exchange',
    routingKey: TASK_PATTERNS.UNASSIGN_TASKS_FROM_SPRINT,
    queue: TASK_PATTERNS.UNASSIGN_TASKS_FROM_SPRINT,
    errorHandler: customErrorHandler,
  })
  unassignTasksFromSprint(payload: { sprintId: string }) {
    return this.tasksService.unassignTasksFromSprint(payload.sprintId);
  }
}