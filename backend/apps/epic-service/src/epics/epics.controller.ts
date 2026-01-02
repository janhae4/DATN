import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EpicsService } from './epics.service';
import { CreateEpicDto, EPIC_EXCHANGE, EPIC_PATTERNS, UpdateEpicDto } from '@app/contracts';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';

@Controller()
export class EpicsController {
  constructor(private readonly epicsService: EpicsService) { }

  @MessagePattern("hello")
  getHello(body: any) {
    console.log("hello from service")
    return body;
  }

  @RabbitRPC({
    exchange: EPIC_EXCHANGE,
    routingKey: EPIC_PATTERNS.CREATE,
    errorHandler: customErrorHandler
  })
  createEpic(createEpicDto: CreateEpicDto) {
    console.log("create epic in service: ", createEpicDto)
    return this.epicsService.create(createEpicDto);
  }

  @MessagePattern(EPIC_PATTERNS.CREATE)
  create(createEpicDto: CreateEpicDto) {
    console.log("create epic in service: ", createEpicDto)
    return this.epicsService.create(createEpicDto);
  }

  @MessagePattern(EPIC_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProject(payload: { projectId: string }) {
    return this.epicsService.findAllByProject(payload.projectId);
  }

  @MessagePattern(EPIC_PATTERNS.FIND_ONE_BY_ID)
  findOne(payload: { epicId: string }) {
    return this.epicsService.findOne(payload.epicId);
  }

  @MessagePattern(EPIC_PATTERNS.UPDATE)
  update(payload: { epicId: string; updateEpicDto: UpdateEpicDto }) {
    return this.epicsService.update(payload.epicId, payload.updateEpicDto);
  }

  @MessagePattern(EPIC_PATTERNS.REMOVE)
  remove(payload: { epicId: string }) {
    return this.epicsService.remove(payload.epicId);
  }
}