import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ListService } from './list.service';
import { CreateListDto, LIST_PATTERNS, UpdateListDto } from '@app/contracts';
import { customErrorHandler } from '@app/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { PROJECT_EVENTS } from '@app/contracts/events/project.events';

@Controller()
export class ListController {
  constructor(private readonly listService: ListService) {}

  @MessagePattern(LIST_PATTERNS.CREATE)
  create(createListDto: CreateListDto) {
    return this.listService.create(createListDto);
  }

  @MessagePattern(LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID)
  findAllByProjectId(payload: { projectId: string }) {
    return this.listService.findAllByProject(payload.projectId);
  }

  @MessagePattern(LIST_PATTERNS.FIND_ALL_BY_TEAM)
  findAllByTeam(payload: { teamId: string }) {
    return this.listService.findAllByTeam(payload.teamId);
  }

  @MessagePattern(LIST_PATTERNS.FIND_ONE_BY_ID)
  findOneById(payload: { id: string }) {
    return this.listService.findOne(payload.id);
  }

  @MessagePattern(LIST_PATTERNS.UPDATE)
  update(payload: { id: string; updateListDto: UpdateListDto }) {
    return this.listService.update(payload.id, payload.updateListDto);
  }

  @MessagePattern(LIST_PATTERNS.REMOVE)
  remove(payload: { id: string }) {
    return this.listService.remove(payload.id);
  }


  //  ---- EVENT HANDLERS ----

  // Handle project created event to create default lists
  @EventPattern(PROJECT_EVENTS.PROJECT_CREATED)
  async handleProjectCreated(@Payload() payload: { projectId: string }) {
    console.log(`Received event PROJECT_CREATED for project: ${payload.projectId}`);
        await this.listService.createDefaultLists(payload.projectId);
  }

  
}
