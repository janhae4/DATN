import { Controller } from '@nestjs/common';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { ListService } from './list.service';
import {
  CreateListDto,
  LIST_PATTERNS,
  UpdateListDto,
  LIST_EXCHANGE,
  EVENTS_EXCHANGE
} from '@app/contracts';
import { PROJECT_EVENTS } from '@app/contracts/events/project.events';

@Controller()
export class ListController {
  constructor(private readonly listService: ListService) { }

  @RabbitRPC({
    exchange: LIST_EXCHANGE,
    routingKey: LIST_PATTERNS.CREATE,
    queue: LIST_PATTERNS.CREATE,
  })
  create(createListDto: CreateListDto) {
    return this.listService.create(createListDto);
  }

  @RabbitRPC({
    exchange: LIST_EXCHANGE,
    routingKey: LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    queue: LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID,
  })
  findAllByProjectId(payload: { projectId: string }) {
    return this.listService.findAllByProject(payload.projectId);
  }

  @RabbitRPC({
    exchange: LIST_EXCHANGE,
    routingKey: LIST_PATTERNS.FIND_ALL_BY_TEAM,
    queue: LIST_PATTERNS.FIND_ALL_BY_TEAM,
  })
  findAllByTeam(payload: { teamId: string }) {
    return this.listService.findAllByTeam(payload.teamId);
  }

  @RabbitRPC({
    exchange: LIST_EXCHANGE,
    routingKey: LIST_PATTERNS.FIND_ONE_BY_ID,
    queue: LIST_PATTERNS.FIND_ONE_BY_ID,
  })
  findOneById(payload: { id: string }) {
    return this.listService.findOne(payload.id);
  }

  @RabbitRPC({
    exchange: LIST_EXCHANGE,
    routingKey: LIST_PATTERNS.UPDATE,
    queue: LIST_PATTERNS.UPDATE,
  })
  update(payload: { id: string; updateListDto: UpdateListDto }) {
    return this.listService.update(payload.id, payload.updateListDto);
  }

  @RabbitRPC({
    exchange: LIST_EXCHANGE,
    routingKey: LIST_PATTERNS.REMOVE,
    queue: LIST_PATTERNS.REMOVE,
  })
  remove(payload: { id: string }) {
    return this.listService.remove(payload.id);
  }



  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: PROJECT_EVENTS.PROJECT_CREATED,
    queue: 'events.list.project.created',
  })
  async handleProjectCreated(payload: { projectId: string }) {
    console.log(`Received event PROJECT_CREATED for project: ${payload.projectId}`);
    await this.listService.createDefaultLists(payload.projectId);
  }
}