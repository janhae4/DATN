import { Inject, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  CreateListDto,
  UpdateListDto,
  LIST_PATTERNS,
  LIST_EXCHANGE,
} from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ListService {
  constructor(@Inject(LIST_EXCHANGE) private readonly client: ClientProxy) {}

  async create(createListDto: CreateListDto) {
    return unwrapRpcResult(
      await this.client.send(LIST_PATTERNS.CREATE, createListDto),
    );
  }

  async findOne(id: string) {
    return unwrapRpcResult(
      await this.client.send(LIST_PATTERNS.FIND_ONE_BY_ID, { id }),
    );
  } 
  
  async findAllByProject(projectId: string) {
    return unwrapRpcResult(
      await this.client.send(LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID, {
        projectId,
      }),
    );
  }

  async update(id: string, updateListDto: UpdateListDto) {
    return unwrapRpcResult(
      await this.client.send(LIST_PATTERNS.UPDATE, { id, updateListDto }),
    );
  }
  async remove(id: string) {
    return unwrapRpcResult(
      await this.client.send(LIST_PATTERNS.REMOVE, { id }),
    );
  }
}
