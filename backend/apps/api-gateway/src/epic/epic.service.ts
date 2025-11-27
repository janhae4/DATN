import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateEpicDto, UpdateEpicDto, EPIC_PATTERNS, EPIC_EXCHANGE } from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class EpicService {
  constructor(
    @Inject(EPIC_EXCHANGE) private readonly client: ClientProxy,
  ) {}

  async create(createEpicDto: CreateEpicDto) {
    return unwrapRpcResult(await this.client.send(EPIC_PATTERNS.CREATE, createEpicDto).toPromise());
  }

  async findAllByProjectId(projectId: string) {
    return unwrapRpcResult(await this.client.send(EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID, { projectId }).toPromise());
  }

  async findOne(id: string) {
    return unwrapRpcResult(await this.client.send(EPIC_PATTERNS.FIND_ONE_BY_ID, { epicId: id }).toPromise());
  }

  async update(id: string, updateEpicDto: UpdateEpicDto) {
    return unwrapRpcResult(await this.client.send(EPIC_PATTERNS.UPDATE, { epicId: id, updateEpicDto }).toPromise());
  }

  async remove(id: string) {
    return unwrapRpcResult(await this.client.send(EPIC_PATTERNS.REMOVE, { epicId: id }).toPromise());
  }
}