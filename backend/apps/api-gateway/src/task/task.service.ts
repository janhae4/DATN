import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CreateTaskDto, UpdateTaskDto, TASK_PATTERNS, TASK_EXCHANGE } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class TaskService {

  constructor(private readonly amqp: AmqpConnection) { }

  async create(createTaskDto: CreateTaskDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.CREATE,
      payload: createTaskDto,
    }));
  }

  async findAllByProjectId(projectId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.FIND_ALL,
      payload: { projectId },
    }));
  }

  async findOne(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.FIND_ONE,
      payload: { id },
    }));
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.UPDATE,
      payload: { id, updateTaskDto },
    }));
  }

  async remove(id: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.REMOVE,
      payload: { id },
    }));
  }

  async addFiles(taskId: string, fileIds: string[]) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.ADD_FILES,
      payload: { taskId, fileIds },
    }));
  }

  async findLabelsByTaskId(taskId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.FIND_ALL_LABELS_BY_TASK_ID,
      payload: { taskId },
    }));
  }


  async getAllTaskLabel(projectId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.GET_ALL_TASK_LABEL,
      payload: { projectId },
    }))
  }

  async handleLabelDeleted(payload: { labelId: string }) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.HANDLE_LABEL_DELETED,
      payload: { id: payload.labelId },
    }));
  }

  async suggestTask(userId: string, objective: string): Promise<string[]> {
    return unwrapRpcResult(await this.amqp.request({
      exchange: TASK_EXCHANGE,
      routingKey: TASK_PATTERNS.SUGGEST_TASK,
      payload: { userId, objective },
    }));
  }
}