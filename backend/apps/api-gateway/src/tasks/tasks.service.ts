import {
  CreateTaskDto,
  RequestGoogleTaskDto,
  TASK_EXCHANGE, // Bạn cần export cái này từ file contracts (tương tự CHATBOT_EXCHANGE)
  TASK_PATTERNS,
  UpdateTaskDto,
} from '@app/contracts';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class TasksService {
  constructor(private readonly amqpConnection: AmqpConnection) { }

  async create(createTaskDto: CreateTaskDto) {
    return await this.amqpConnection.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.CREATE,
      payload: createTaskDto,
    });
  }

  async findAll() {
    return await this.amqpConnection.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.FIND_ALL,
      payload: {},
    });
  }

  async findOne(id: number) {
    return await this.amqpConnection.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.FIND_ONE,
      payload: { id },
    });
  }

  async findByUserId(id: string) {
    return await this.amqpConnection.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.FIND_BY_USER_ID,
      payload: id,
    });
  }

  async update(id: number, updateTaskDto: UpdateTaskDto) {
    return await this.amqpConnection.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.UPDATE,
      payload: { id, data: updateTaskDto },
    });
  }

  async remove(id: number) {
    return await this.amqpConnection.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.REMOVE,
      payload: { id },
    });
  }

  async findGoogleEvents(request: Request) {
    const cookies = request.cookies;
    const data: RequestGoogleTaskDto = {
      accessToken: cookies.accessToken as string,
      refreshToken: cookies.refreshToken as string,
    };

    return await this.amqpConnection.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.FIND_GOOGLE_EVENTS,
      payload: data,
    });
  }
}