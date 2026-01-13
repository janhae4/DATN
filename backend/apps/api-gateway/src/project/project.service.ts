import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  CreateProjectDto,
  UpdateProjectDto,
  PROJECT_PATTERNS,
  PROJECT_EXCHANGE,
  TASK_PATTERNS,
  TASK_EXCHANGE, // <-- Nhớ import Exchange
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq'; // <-- Xài cái này
import { unwrapRpcResult } from '../common/helper/rpc'; // <-- Xài cái helper xịn xò này
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_EXCHANGE) private readonly client: ClientProxy,
    private readonly amqpConnection: AmqpConnection,
  ) { }

  // --- CREATE ---
  async create(createProjectDto: CreateProjectDto) {
    console.log('Creating project with data:', createProjectDto);
    return unwrapRpcResult(this.client.send(PROJECT_PATTERNS.CREATE, createProjectDto));
  }

  async getStat(id: string, userId: string) {
    return unwrapRpcResult(
      this.amqpConnection.request({
        exchange: TASK_EXCHANGE,
        routingKey: TASK_PATTERNS.GET_STATS,
        payload: { userId, projectId: id },
      })
    );
  }

  async findOne(id: string) {
    return unwrapRpcResult(
      this.client.send(PROJECT_PATTERNS.GET_BY_ID, { id }),
    );
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    return unwrapRpcResult(
      this.client.send(PROJECT_PATTERNS.UPDATE, { id, updateProjectDto }),
    );
  }

  async remove(id: String) {
    return unwrapRpcResult(this.client.send(PROJECT_PATTERNS.REMOVE, { id }));
  }

  async findAllByTeamId(teamId: string) {
    return unwrapRpcResult(
      this.client.send(PROJECT_PATTERNS.FIND_ALL_BY_TEAM_ID, { teamId }),
    );
  }


}
