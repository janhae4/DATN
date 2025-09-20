import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskServiceService } from './task-service.service';
import { Task } from '../../../generated/prisma';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskPayloadDto } from './dto/update-task-payload.dto';
import { FindTaskDto } from './dto/find-task.dto';

@Controller()
export class TaskServiceController {
  constructor(private readonly taskServiceService: TaskServiceService) {}

  @MessagePattern('task.findAll')
  async findAll(): Promise<Task[]> {
    return this.taskServiceService.findAll();
  }

  @MessagePattern('task.findOne')
  async findOne(@Payload() data: FindTaskDto): Promise<Task | null> {
    return this.taskServiceService.findOne(data.id);
  }

  @MessagePattern('task.create')
  async create(@Payload() createTaskDto: CreateTaskDto): Promise<Task> {
    const data = {
      ...createTaskDto,
      deadline: createTaskDto.deadline ? new Date(createTaskDto.deadline) : undefined,
    };
    return this.taskServiceService.create(data);
  }

  @MessagePattern('task.update')
  async update(@Payload() payload: UpdateTaskPayloadDto): Promise<Task> {
    const { id, data: updateData } = payload;
    const processedData = {
      ...updateData,
      deadline: updateData.deadline ?? undefined,
    };
    return this.taskServiceService.update(id, processedData);
  }

  @MessagePattern('task.remove')
  async remove(@Payload() data: FindTaskDto): Promise<Task> {
    return this.taskServiceService.remove(data.id);
  }
}
