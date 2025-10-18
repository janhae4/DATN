import {
  CreateTaskDto,
  RequestGoogleTaskDto,
  TASK_PATTERNS,
  UpdateTaskDto,
} from '@app/contracts';
import { TASK_CLIENT } from '@app/contracts/constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';

@Injectable()
export class TasksService {
  constructor(@Inject(TASK_CLIENT) private readonly client: ClientProxy) {}

  create(createTaskDto: CreateTaskDto) {
    return this.client.send(TASK_PATTERNS.CREATE, createTaskDto);
  }

  findAll() {
    return this.client.send(TASK_PATTERNS.FIND_ALL, {});
  }

  findOne(id: number) {
    return this.client.send(TASK_PATTERNS.FIND_ONE, { id });
  }

  findByUserId(id: string) {
    return this.client.send(TASK_PATTERNS.FIND_BY_USER_ID, id);
  }

  update(id: number, updateTaskDto: UpdateTaskDto) {
    return this.client.send(TASK_PATTERNS.UPDATE, { id, data: updateTaskDto });
  }

  remove(id: number) {
    return this.client.send(TASK_PATTERNS.REMOVE, { id });
  }

  findGoogleEvents(request: Request) {
    const cookies = request.cookies;
    const data: RequestGoogleTaskDto = {
      accessToken: cookies.accessToken as string,
      refreshToken: cookies.refreshToken as string,
    };
    return this.client.send(TASK_PATTERNS.FIND_GOOGLE_EVENTS, data);
  }
}
