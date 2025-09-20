import { Inject, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TasksService {
  constructor(
    @Inject('TASKS_SERVICE') private readonly client: ClientProxy,
  ) {}
  create(createTaskDto: CreateTaskDto) {
    return this.client.send('task.create', createTaskDto);
  }

  findAll() {
    return this.client.send('task.findAll', {});
  }

  findOne(id: number) {
    return this.client.send('task.findOne', { id });
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.client.send('task.update', { id, data: updateTaskDto });
  }

  remove(id: number) {
    return this.client.send('task.remove', { id });
  }
}
