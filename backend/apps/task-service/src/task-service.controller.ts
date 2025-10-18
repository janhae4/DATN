import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TaskServiceService } from './task-service.service';
import { Task } from './generated/prisma';
import {
  CreateTaskDto,
  RequestGoogleTaskDto,
  TASK_PATTERNS,
  UpdateTaskDto,
} from '@app/contracts';

@Controller()
export class TaskServiceController {
  constructor(private readonly taskServiceService: TaskServiceService) {}

  @MessagePattern(TASK_PATTERNS.FIND_ALL)
  async findAll(): Promise<Task[]> {
    return this.taskServiceService.findAll();
  }

  @MessagePattern(TASK_PATTERNS.FIND_ONE)
  async findOne(@Payload() id: string): Promise<Task> {
    return this.taskServiceService.findOne(id);
  }

  @MessagePattern(TASK_PATTERNS.FIND_BY_USER_ID)
  async findByUserId(@Payload() id: string): Promise<Task[]> {
    return this.taskServiceService.findByUserId(id);
  }

  @MessagePattern(TASK_PATTERNS.CREATE)
  async create(@Payload() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskServiceService.create(createTaskDto);
  }

  @MessagePattern(TASK_PATTERNS.UPDATE)
  async update(@Payload() payload: UpdateTaskDto): Promise<Task> {
    return this.taskServiceService.update(payload.id, payload);
  }

  @MessagePattern(TASK_PATTERNS.REMOVE)
  async remove(@Payload() id: string): Promise<Task> {
    return this.taskServiceService.remove(id);
  }

  @MessagePattern(TASK_PATTERNS.FIND_GOOGLE_EVENTS)
  async findGoogleEvents(@Payload() data: RequestGoogleTaskDto) {
    return this.taskServiceService.findGoogleEvents(data.accessToken);
  }
}
