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
import { customErrorHandler } from '@app/common';

@Controller()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) { }


  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.GET_DETAILS,
    queue: LABEL_PATTERNS.GET_DETAILS,
    errorHandler: customErrorHandler
  })
  getLabelDetails(payload: { labelIds: string[] }) {
    return this.labelsService.findByIds(payload.labelIds);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.CREATE,
    queue: LABEL_PATTERNS.CREATE,
    errorHandler: customErrorHandler
  })
  create(createLabelDto: CreateLabelDto) {
    return this.labelsService.create(createLabelDto);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    queue: LABEL_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    errorHandler: customErrorHandler
  })
  findAllByProject(payload: { projectId: string }) {
    return this.labelsService.findAllByProject(payload.projectId);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.FIND_ONE_BY_ID,
    queue: LABEL_PATTERNS.FIND_ONE_BY_ID,
    errorHandler: customErrorHandler
  })
  findOne(payload: { id: string }) {
    return this.labelsService.findOne(payload.id);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.UPDATE,
    queue: LABEL_PATTERNS.UPDATE,
    errorHandler: customErrorHandler
  })
  update(payload: { id: string; updateLabelDto: UpdateLabelDto }) {
    console.log("updating label: ", payload);
    return this.labelsService.update(payload.id, payload.updateLabelDto);
  }

  @RabbitRPC({
    exchange: LABEL_EXCHANGE,
    routingKey: LABEL_PATTERNS.REMOVE,
    queue: LABEL_PATTERNS.REMOVE,
    errorHandler: customErrorHandler
  })
  remove(payload: { id: string }) {
    return this.labelsService.remove(payload.id);
  }
}