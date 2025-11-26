import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CreateTaskDto, UpdateTaskDto, TASK_PATTERNS } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class TaskService {
  constructor(private readonly amqp: AmqpConnection) {}

  async create(createTaskDto: CreateTaskDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'task_exchange',
      routingKey: TASK_PATTERNS.CREATE,
      payload: createTaskDto, // Gửi trực tiếp DTO, ko bọc {createTaskDto} nữa
    }));
  }

  async findAllByProjectId(projectId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'task_exchange',
      routingKey: TASK_PATTERNS.FIND_ALL,
      payload: { projectId },
    }));
  }

  async findOne(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'task_exchange',
      routingKey: TASK_PATTERNS.FIND_ONE,
      payload: { id },
    }));
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'task_exchange',
      routingKey: TASK_PATTERNS.UPDATE,
      payload: { id, updateTaskDto },
    }));
  }

  async remove(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'task_exchange',
      routingKey: TASK_PATTERNS.REMOVE,
      payload: { id },
    }));
  }

  async addFiles(taskId: string, fileIds: string[]) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'task_exchange',
      routingKey: TASK_PATTERNS.ADD_FILES,
      payload: { taskId, fileIds },
    }));
  }
}