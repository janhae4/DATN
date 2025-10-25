import { Controller } from '@nestjs/common';
import { SearchService } from './search.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EVENTS, EVENTS_EXCHANGE, SEARCH_EXCHANGE, SEARCH_PATTERN } from '@app/contracts';
import type { SearchMessageDto, SendMessageEventPayload, User } from '@app/contracts'
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.USER_UPDATED,
    queue: "events_search_user_updated"
  })
  handleUserUpdated(@Payload() user: Partial<User>) {
    this.searchService.handleUserUpdated(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.NEW_MESSAGE,
    queue: "events_search_new_message"
  }) handleNewMessage(@Payload() payload: SendMessageEventPayload) {
    console.log('EVENTS.NEW_MESSAGE (subscriber):', EVENTS.NEW_MESSAGE);
    console.log("RECEIVED")
    this.searchService.handleNewMessage(payload);
  }

  @RabbitRPC({
    exchange: SEARCH_EXCHANGE,
    routingKey: SEARCH_PATTERN.SEARCH_MESSAGE,
    queue: SEARCH_PATTERN.SEARCH_MESSAGE
  })
  search(payload: SearchMessageDto) {
    return this.searchService.searchMessages(payload);
  }
}
