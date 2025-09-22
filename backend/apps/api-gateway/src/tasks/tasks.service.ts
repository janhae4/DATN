import { Inject, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ClientProxy } from '@nestjs/microservices';
import { TASK_PATTERNS } from '@app/contracts/task/task.patterns';

@Injectable()
export class TasksService {
  constructor(
    @Inject('TASKS_SERVICE') private readonly client: ClientProxy,
  ) {}
  create(createTaskDto: CreateTaskDto) {
    return this.client.send(TASK_PATTERNS.CREATE, createTaskDto);
  }

  findAll() {
    return this.client.send(TASK_PATTERNS.FIND_ALL, {});
  }

  findOne(id: number) {
    return this.client.send(TASK_PATTERNS.FIND_ONE, { id });
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.client.send(TASK_PATTERNS.UPDATE, { id, data: updateTaskDto });
  }

  remove(id: number) {
    return this.client.send(TASK_PATTERNS.REMOVE, { id });
  }
}
