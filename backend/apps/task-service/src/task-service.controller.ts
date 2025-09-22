import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskServiceService } from './task-service.service';
import { Task } from '@app/prisma';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskPayloadDto } from './dto/update-task-payload.dto';
import { FindTaskDto } from './dto/find-task.dto';
import { TASK_PATTERNS } from '@app/contracts/task/task.patterns';

@Controller()
export class TaskServiceController {
  constructor(private readonly taskServiceService: TaskServiceService) {}

  @MessagePattern(TASK_PATTERNS.FIND_ALL)
  async findAll(): Promise<Task[]> {
    return this.taskServiceService.findAll();
  }

  @MessagePattern(TASK_PATTERNS.FIND_ONE)
  async findOne(@Payload() data: FindTaskDto): Promise<Task> {
    return this.taskServiceService.findOne(data.id);
  }

  @MessagePattern(TASK_PATTERNS.CREATE)
  async create(@Payload() createTaskDto: CreateTaskDto): Promise<Task> {
    const data = {
      ...createTaskDto,
      deadline: createTaskDto.deadline ? new Date(createTaskDto.deadline) : undefined,
    };
    return this.taskServiceService.create(data);
  }

  @MessagePattern(TASK_PATTERNS.UPDATE)
  async update(@Payload() payload: UpdateTaskPayloadDto): Promise<Task> {
    const { id, data: updateData } = payload;
    const processedData = {
      ...updateData,
      deadline: updateData.deadline ?? undefined,
    };
    return this.taskServiceService.update(id, processedData);
  }

  @MessagePattern(TASK_PATTERNS.REMOVE)
  async remove(@Payload() data: FindTaskDto): Promise<Task> {
    return this.taskServiceService.remove(data.id);
  }
}
