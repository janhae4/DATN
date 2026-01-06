import { Controller } from '@nestjs/common';
import { SearchService } from './search.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { EVENTS, EVENTS_EXCHANGE, SEARCH_EXCHANGE, SEARCH_PATTERN } from '@app/contracts';
import type { LeaveMemberEventPayload, SearchMessageDto, SendMessageEventPayload, User } from '@app/contracts'
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.USER_UPDATED,
    queue: "events_search_user_updated",
    errorHandler: customErrorHandler
  })
  handleUserUpdated(user: Partial<User>) {
    this.searchService.handleUserUpdated(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.NEW_MESSAGE,
    queue: "events_search_new_message",
    errorHandler: customErrorHandler

  }) handleNewMessage(payload: SendMessageEventPayload) {
    console.log('EVENTS.NEW_MESSAGE (subscriber):', EVENTS.NEW_MESSAGE);
    console.log("RECEIVED")
    this.searchService.handleNewMessage(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: "events_search_leave_team",
    errorHandler: customErrorHandler
  })
  handleLeaveTeam(payload: LeaveMemberEventPayload) {
    this.searchService.handleUserRemovedFromTeam(payload.requester.id, payload.teamId);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_TEAM,
    queue: "events_search_remove_team",
    errorHandler: customErrorHandler
  })
  handleRemoveTeam(payload: LeaveMemberEventPayload) {
    this.searchService.handleUserRemovedFromTeam(payload.requester.id, payload.teamId);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: "events_search_remove_member",
    errorHandler: customErrorHandler
  })
  handleRemoveMember(payload: LeaveMemberEventPayload) {
    this.searchService.handleUserRemovedFromTeam(payload.requester.id, payload.teamId);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: "events_search_add_member",
    errorHandler: customErrorHandler
  })
  handleAddMember(payload: LeaveMemberEventPayload) {
    this.searchService.handleUserAddedToTeam(payload.requester.id, payload.teamId);
  }

  // @RabbitSubscribe({
  //   exchange: SEARCH_EXCHANGE,
  //   routingKey: SEARCH_PATTERN.NEW_MESSAGE_CHATBOT,
  //   queue: SEARCH_PATTERN.NEW_MESSAGE_CHATBOT,
  //   errorHandler: customErrorHandler
  // })
  // handleNewMessageChatbot(payload: MessageEventPayload) {
  //   this.searchService.handleNewMessageChatbot(payload);
  // }

  @RabbitRPC({
    exchange: SEARCH_EXCHANGE,
    routingKey: SEARCH_PATTERN.SEARCH_MESSAGE,
    queue: SEARCH_PATTERN.SEARCH_MESSAGE,
    errorHandler: customErrorHandler
  })
  search(payload: SearchMessageDto) {
    return this.searchService.searchMessages(payload);
  }

  @RabbitRPC({
    exchange: SEARCH_EXCHANGE,
    routingKey: SEARCH_PATTERN.INDEX_DOCUMENT_CHUNK_ROUTING_KEY,
    queue: SEARCH_PATTERN.INDEX_DOCUMENT_CHUNK_ROUTING_KEY,
    errorHandler: customErrorHandler
  })
  async handleIndexDocumentChunk(payload: {
    chunk_id: string;
    content: string;
    metadata: {
      user_id: string;
      team_id?: string;
      source: string;
      file_name: string;
      page?: number;
      processed_at: string;
    };
  }) {
    return this.searchService.handleIndexDocumentChunk(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.DELETE_DOCUMENT,
    queue: 'events.delete.document.search',
    errorHandler: customErrorHandler
  })
  async handleDeleteDocumentIndex(payload: { fileId: string }) {
    return this.searchService.handleDeleteDocumentIndex(payload.fileId);
  }
}
