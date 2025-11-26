import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CreateSprintDto, SPRINT_PATTERNS, UpdateSprintDto } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class SprintService {
  constructor(private readonly amqp: AmqpConnection) {}

  async create(createSprintDto: CreateSprintDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'sprint_exchange',
      routingKey: SPRINT_PATTERNS.CREATE,
      payload: createSprintDto,
    }));
  }

  async findAllByProjectId(projectId: string, userId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'sprint_exchange',
      routingKey: SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId, userId },
    }));
  }

  async findOne(id: string, userId: string) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: 'sprint_exchange',
      routingKey: SPRINT_PATTERNS.FIND_ONE_BY_ID,
      payload: { id, userId },
    }));
  }
  
  // (Cần thêm hàm update/remove trong gateway service nếu controller có dùng, tương tự mẫu trên)
}