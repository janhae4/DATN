import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ListService } from './list.service';
import { CreateListDto, LIST_PATTERNS, UpdateListDto } from '@app/contracts';
import { customErrorHandler } from '@app/common';

@Controller()
export class ListController {
  constructor(private readonly listService: ListService) {}

  @RabbitRPC({
    exchange: 'status_exchange', // Lưu ý tên exchange của service này là 'status_exchange'
    routingKey: LIST_PATTERNS.CREATE,
    queue: LIST_PATTERNS.CREATE,
    errorHandler: customErrorHandler,
  })
  create(createListDto: CreateListDto) {
    return this.listService.create(createListDto);
  }

  @RabbitRPC({
    exchange: 'status_exchange',
    routingKey: LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    queue: LIST_PATTERNS.FIND_ALL_BY_PROJECT_ID,
    errorHandler: customErrorHandler,
  })
  findAllByProjectId(payload: { projectId: string }) {
    return this.listService.findAllByProject(payload.projectId);
  }

  @RabbitRPC({
    exchange: 'status_exchange',
    routingKey: LIST_PATTERNS.FIND_ONE_BY_ID,
    queue: LIST_PATTERNS.FIND_ONE_BY_ID,
    errorHandler: customErrorHandler,
  })
  findOneById(payload: { id: string }) {
    return this.listService.findOne(payload.id);
  }

  @RabbitRPC({
    exchange: 'status_exchange',
    routingKey: LIST_PATTERNS.UPDATE,
    queue: LIST_PATTERNS.UPDATE,
    errorHandler: customErrorHandler,
  })
  update(payload: { id: string; updateListDto: UpdateListDto }) {
    return this.listService.update(payload.id, payload.updateListDto);
  }

  @RabbitRPC({
    exchange: 'status_exchange',
    routingKey: LIST_PATTERNS.REMOVE,
    queue: LIST_PATTERNS.REMOVE,
    errorHandler: customErrorHandler,
  })
  remove(payload: { id: string }) {
    return this.listService.remove(payload.id);
  }
}