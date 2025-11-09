import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { 
  CreateTaskDto, 
  UpdateTaskDto, 
  TASK_PATTERNS, 
  PROJECT_CLIENT 
} from '@app/contracts';

@Injectable()
export class TaskService {
  constructor(
    @Inject(PROJECT_CLIENT) private readonly projectClient: ClientProxy,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    
    return firstValueFrom(
      this.projectClient.send(TASK_PATTERNS.CREATE, {
        createTaskDto,
      }),
    );
  }

  async findAllByProjectId(projectId: string) {
    return firstValueFrom(
      this.projectClient.send(TASK_PATTERNS.FIND_ALL, {
        projectId,
      }),
    );
  }

  async findOne(id: string) {
    return firstValueFrom(
      this.projectClient.send(TASK_PATTERNS.FIND_ONE, {
        id,
      }),
    );
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    return firstValueFrom(
      this.projectClient.send(TASK_PATTERNS.UPDATE, {
        id,
        updateTaskDto,
      }),
    );
  }

  async remove(id: string) {
    return firstValueFrom(
      this.projectClient.send(TASK_PATTERNS.REMOVE, {
        id,
      }),
    );
  }
}
