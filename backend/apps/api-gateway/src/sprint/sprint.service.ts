import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { CreateSprintDto, SPRINT_EXCHANGE, SPRINT_PATTERNS, SprintStatus, UpdateSprintDto } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';
import { ClientProxy } from '@nestjs/microservices/client/client-proxy';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SprintService {
  constructor(@Inject(SPRINT_EXCHANGE) private readonly client: ClientProxy) { }

  async create(createSprintDto: CreateSprintDto) {
    return unwrapRpcResult(await firstValueFrom(this.client.send(SPRINT_PATTERNS.CREATE, createSprintDto)));
  }

  async findAllByProjectId(projectId: string, userId: string) {
    return unwrapRpcResult(await firstValueFrom(this.client.send(SPRINT_PATTERNS.FIND_ALL_BY_PROJECT_ID, { projectId, userId })));
  }

  async findOne(id: string, userId: string) {
    return unwrapRpcResult(await firstValueFrom(this.client.send(SPRINT_PATTERNS.FIND_ONE_BY_ID, { id, userId })));
  }

  async update(id: string, updateSprintDto: UpdateSprintDto, userId: string) {
    return unwrapRpcResult(await firstValueFrom(this.client.send(SPRINT_PATTERNS.UPDATE, { id, updateSprintDto, userId })));
  }

  async remove(id: string, userId: string) {
    return unwrapRpcResult(await firstValueFrom(this.client.send(SPRINT_PATTERNS.REMOVE, { id, userId })));
  }

  async completeSprint(id: string, userId: string) {
    return unwrapRpcResult(await firstValueFrom(this.client.send(SPRINT_PATTERNS.COMPLETE_SPRINT, { id, userId })));
  }

  async findAll(projectId: string, teamId: string, userId: string, status?: SprintStatus[]) {
    return unwrapRpcResult(await firstValueFrom(this.client.send(SPRINT_PATTERNS.FIND_ALL, { projectId, teamId, status, userId })));

  }
}