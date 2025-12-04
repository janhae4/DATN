import { Controller, Logger } from '@nestjs/common';
import { VideoChatService } from './video-chat.service';
import { CreateCallDto } from '@app/contracts/video-chat/dto/create-call.dto';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { KickUserDto, VIDEO_CHAT_EXCHANGE, VIDEO_CHAT_PATTERN } from '@app/contracts';
import { customErrorHandler } from '@app/common';

@Controller()
export class VideoChatController {
  private readonly logger = new Logger(VideoChatController.name);

  constructor(private readonly videoChatService: VideoChatService) { }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.CREATE_CALL,
    queue: VIDEO_CHAT_PATTERN.CREATE_CALL,
    errorHandler: customErrorHandler
  })
  async createCall(createCallDto: CreateCallDto) {
    this.logger.log(`Handling Create Call for Room: ${createCallDto.teamId}`);
    return this.videoChatService.createOrJoinCall(createCallDto.userId || "", createCallDto.teamId, createCallDto.refId, createCallDto.refType);
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.KICK_USER,
    queue: VIDEO_CHAT_PATTERN.KICK_USER,
    errorHandler: customErrorHandler
  })
  async kickUser(payload: KickUserDto) {
    console.log(payload)
    const { requesterId, targetUserId, roomId } = payload;
    return this.videoChatService.kickUser(requesterId, targetUserId, roomId);
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.UNKICK_USER,
    queue: VIDEO_CHAT_PATTERN.UNKICK_USER,
    errorHandler: customErrorHandler
  })
  async unKickUser(payload: KickUserDto) {
    const { requesterId, targetUserId, roomId } = payload;
    return this.videoChatService.unKickUser(requesterId, targetUserId, roomId);
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.GET_HISTORY,
    queue: VIDEO_CHAT_PATTERN.GET_HISTORY,
    errorHandler: customErrorHandler
  })
  async getCallHistory(userId: string) {
    return this.videoChatService.getCallHistory(userId);
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.GET_HISTORY_BY_ROOM,
    queue: VIDEO_CHAT_PATTERN.GET_HISTORY_BY_ROOM,
    errorHandler: customErrorHandler
  })
  async getCallHistoryByRoomId(roomId: string) {
    return this.videoChatService.getCallHistoryByRoomId(roomId);
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.JOIN_ROOM,
    queue: VIDEO_CHAT_PATTERN.JOIN_ROOM,
    errorHandler: customErrorHandler
  })
  handleJoinRoom(data: {
    clientId: string; roomId: string

  }) {
    this.logger.log(`RabbitMQ: Client ${data.clientId} joined room ${data.roomId}`);
    return { success: true, clientId: data.clientId, roomId: data.roomId };
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.RECEIVE_TRANSCRIPT,
    queue: VIDEO_CHAT_PATTERN.RECEIVE_TRANSCRIPT,
    errorHandler: customErrorHandler
  })
  async handleAppendTranscript(data: {
    userId: string; content: string; roomId: string
  }) {
    this.logger.debug(data)
    return await this.videoChatService.handleTranscriptReceive(data.roomId, data.userId, data.content, new Date());
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.PROCESS_TRANSCRIPT,
    queue: VIDEO_CHAT_PATTERN.PROCESS_TRANSCRIPT,
    errorHandler: customErrorHandler
  })
  async processMeetingSummary(roomId: string) {
    return await this.videoChatService.processMeetingSummary(roomId);
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.ANSWER,
    queue: VIDEO_CHAT_PATTERN.ANSWER,
    errorHandler: customErrorHandler
  })
  handleAnswer(data: {
    clientId: string; sdp: any; roomId: string; targetId: string

  }) {
    this.logger.log(`RabbitMQ: Answer from ${data.clientId} to ${data.targetId}`);
    return {
      success: true,
      type: 'answer',
      from: data.clientId,
      to: data.targetId,
    };
  }

  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.DISCONNECT,
    queue: VIDEO_CHAT_PATTERN.DISCONNECT,
    errorHandler: customErrorHandler
  })
  handleClientDisconnected(data: {
    clientId: string

  }) {
    this.logger.log(`RabbitMQ: Client ${data.clientId} disconnected`);
    return { success: true, clientId: data.clientId };
  }
}