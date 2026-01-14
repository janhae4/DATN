import { Injectable } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import {
  CreateLabelDto,
  UpdateLabelDto,
  LABEL_PATTERNS,
  LABEL_EXCHANGE
} from '@app/contracts';
import { TaskLabel } from '@app/contracts/events/task-label.event';

@Injectable()
export class LabelService {
  constructor(
    private readonly rmqClient: RmqClientService
  ) { }

  async create(createLabelDto: CreateLabelDto) {
    return this.rmqClient.request({
      exchange: LABEL_EXCHANGE,
      routingKey: LABEL_PATTERNS.CREATE,
      payload: createLabelDto,
    });
  }

  async findAllByProject(projectId: string) {
    return this.rmqClient.request({
      exchange: LABEL_EXCHANGE,
      routingKey: LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID,
      payload: { projectId },
    });
  }

  async findOne(id: string) {
    return this.rmqClient.request({
      exchange: LABEL_EXCHANGE,
      routingKey: LABEL_PATTERNS.FIND_ONE_BY_ID,
      payload: { id },
    });
  }

  async update(id: string, updateLabelDto: UpdateLabelDto) {
    console.log("update label in api gateway: ", id, updateLabelDto);
    return this.rmqClient.request({
      exchange: LABEL_EXCHANGE,
      routingKey: LABEL_PATTERNS.UPDATE,
      payload: { id, updateLabelDto },
    });
  }

  async remove(id: string) {
    return this.rmqClient.request({
      exchange: LABEL_EXCHANGE,
      routingKey: LABEL_PATTERNS.REMOVE,
      payload: { id },
    });
  }

  async findByIds(labelIds: string[]) {
    return this.rmqClient.request({
      exchange: LABEL_EXCHANGE,
      routingKey: TaskLabel.GET_DETAILS,
      payload: { labelIds },
    });
  }
}