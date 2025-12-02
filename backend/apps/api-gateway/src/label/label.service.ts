import { Inject, Injectable } from '@nestjs/common';
import { CreateLabelDto, UpdateLabelDto, LABEL_PATTERNS, LABEL_EXCHANGE } from '@app/contracts';
import { TaskLabel } from '@app/contracts/events/task-label.event';
import { unwrapRpcResult } from '../common/helper/rpc';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class LabelService {
  constructor(@Inject(LABEL_EXCHANGE) private readonly client: ClientProxy) {}

  async create(createLabelDto: CreateLabelDto) {
    return unwrapRpcResult(await this.client.send(LABEL_PATTERNS.CREATE, createLabelDto));
  }

  async findAllByProject(projectId: string) {
    return unwrapRpcResult(await this.client.send(LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID, { projectId }));
  }

  async findOne(id: string) {
    return unwrapRpcResult(await this.client.send(LABEL_PATTERNS.FIND_ONE_BY_ID, { id }));
  }

  async update(id: string, updateLabelDto: UpdateLabelDto) {
    console.log("update label in api gateway: ", id, updateLabelDto)
    return unwrapRpcResult(await this.client.send(LABEL_PATTERNS.UPDATE, { id, updateLabelDto }));
  }

  async remove(id: string) {
    return unwrapRpcResult(await this.client.send(LABEL_PATTERNS.REMOVE, { id }));
  }

  async findByIds(labelIds: string[]) {
    return unwrapRpcResult(await this.client.send(TaskLabel.GET_DETAILS, { labelIds }));
  }
}