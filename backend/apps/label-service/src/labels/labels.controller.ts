import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { LabelsService } from './labels.service';
import {
  CreateLabelDto,
  LABEL_PATTERNS,
  UpdateLabelDto,
  LABEL_EXCHANGE,
  TASK_EXCHANGE
} from '@app/contracts';

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) { }


  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.GET_DETAILS,
    queue: LABEL_PATTERNS.GET_DETAILS,
  })
  getLabelDetails(payload: { labelIds: string[] }) {
    return this.labelsService.findByIds(payload.labelIds);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.CREATE,
    queue: LABEL_PATTERNS.CREATE,
  })
  create(createLabelDto: CreateLabelDto) {
    return this.labelsService.create(createLabelDto);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    queue: LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID,
  })
  findAllByProject(payload: { projectId: string }) {
    return this.labelsService.findAllByProject(payload.projectId);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.FIND_ONE_BY_ID,
    queue: LABEL_PATTERNS.FIND_ONE_BY_ID,
  })
  findOne(payload: { id: string }) {
    return this.labelsService.findOne(payload.id);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.UPDATE,
    queue: LABEL_PATTERNS.UPDATE,
  })
  update(payload: { id: string; updateLabelDto: UpdateLabelDto }) {
    console.log("updating label: ", payload);
    return this.labelsService.update(payload.id, payload.updateLabelDto);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.REMOVE,
    queue: LABEL_PATTERNS.REMOVE,
  })
  remove(payload: { id: string }) {
    return this.labelsService.remove(payload.id);
  }
}