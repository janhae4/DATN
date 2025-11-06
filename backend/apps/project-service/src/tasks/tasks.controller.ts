import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, TASK_PATTERNS } from '@app/contracts';

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @MessagePattern(TASK_PATTERNS.CREATE)
  create(@Payload() payload: { createTaskDto: CreateTaskDto; userId: string }) {
    return this.tasksService.create(payload.createTaskDto, payload.userId);
  }

  @MessagePattern(TASK_PATTERNS.FIND_ALL)
  findAllByProject(@Payload() payload: { projectId: string }) {
    return this.tasksService.findAllByProject(payload.projectId);
  }

  @MessagePattern(TASK_PATTERNS.FIND_ONE)
  findOne(@Payload() payload: { taskId: string }) {
    return this.tasksService.findOne(payload.taskId);
  }

  @MessagePattern(TASK_PATTERNS.UPDATE)
  update(
    @Payload()
    payload: {
      taskId: string;
      updateTaskDto: UpdateTaskDto;
      userId: string;
    },
  ) {
    return this.tasksService.update(
      payload.taskId,
      payload.updateTaskDto,
      payload.userId,
    );
  }

  @MessagePattern(TASK_PATTERNS.REMOVE)
  remove(@Payload() payload: { taskId: string }) {
    return this.tasksService.remove(payload.taskId);
  }

}