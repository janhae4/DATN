import { Controller, Logger } from '@nestjs/common';
import { VideoChatService } from './video-chat.service';
import { CreateCallDto } from '@app/contracts/video-chat/dto/create-call.dto';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { KickUserDto, VIDEO_CHAT_EXCHANGE, VIDEO_CHAT_PATTERN } from '@app/contracts';
import { customErrorHandler } from '@app/common';

/**
 * Controller responsible for handling video chat related operations
 * Uses RabbitMQ for message-based communication between services
 */
@Controller()
export class VideoChatController {
  private readonly logger = new Logger(VideoChatController.name);

  constructor(private readonly videoChatService: VideoChatService) { }

  /**
   * Creates a new video call or joins an existing one
   * @param createCallDto - Contains call creation/joining details
   * @param createCallDto.userId - ID of the user creating/joining the call
   * @param createCallDto.teamId - ID of the team associated with the call
   * @param createCallDto.refId - Reference ID for the call (e.g., project ID)
   * @param createCallDto.refType - Type of the reference (e.g., 'project', 'meeting')
   * @returns Call details or join information
   */
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

  /**
   * Kicks a user from a video call room
   * @param payload - Contains kick request details
   * @param payload.requesterId - ID of the user requesting the kick
   * @param payload.targetUserId - ID of the user to be kicked
   * @param payload.roomId - ID of the room from which to kick the user
   * @returns Result of the kick operation
   */
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

  /**
   * Reverses a user kick from a video call room
   * @param payload - Contains unkick request details
   * @param payload.requesterId - ID of the user requesting the unkick
   * @param payload.targetUserId - ID of the user to be unkicked
   * @param payload.roomId - ID of the room from which to unkick the user
   * @returns Result of the unkick operation
   */
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

  /**
   * Retrieves call history for a specific user
   * @param userId - ID of the user whose call history to retrieve
   * @returns Array of call history entries for the user
   */
  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.GET_HISTORY,
    queue: VIDEO_CHAT_PATTERN.GET_HISTORY,
    errorHandler: customErrorHandler
  })
  async getCallHistory(userId: string) {
    return this.videoChatService.getCallHistory(userId);
  }

  /**
   * Retrieves call history for a specific room
   * @param roomId - ID of the room to get history for
   * @returns Call history details for the specified room
   */
  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.GET_HISTORY_BY_ROOM,
    queue: VIDEO_CHAT_PATTERN.GET_HISTORY_BY_ROOM,
    errorHandler: customErrorHandler
  })
  async getCallHistoryByRoomId(roomId: string) {
    return this.videoChatService.getCallHistoryByRoomId(roomId);
  }

  /**
   * Handles a client joining a video room
   * @param data - Join room request data
   * @param data.clientId - ID of the client joining the room
   * @param data.roomId - ID of the room being joined
   * @returns Success status and join confirmation
   */
  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.JOIN_ROOM,
    queue: VIDEO_CHAT_PATTERN.JOIN_ROOM,
    errorHandler: customErrorHandler
  })
  handleJoinRoom(data: { clientId: string; roomId: string }) {
    this.logger.log(`RabbitMQ: Client ${data.clientId} joined room ${data.roomId}`);
    return { success: true, clientId: data.clientId, roomId: data.roomId };
  }

  /**
   * Handles receiving and storing meeting transcripts
   * @param data - Transcript data
   * @param data.userId - ID of the user who generated the transcript
   * @param data.content - Transcript text content
   * @param data.roomId - ID of the room where the transcript was generated
   * @returns Status of the transcript storage operation
   */
  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.RECEIVE_TRANSCRIPT,
    queue: VIDEO_CHAT_PATTERN.RECEIVE_TRANSCRIPT,
    errorHandler: customErrorHandler
  })
  async handleAppendTranscript(data: { userId: string; content: string; roomId: string }) {
    this.logger.debug(data)
    return await this.videoChatService.handleTranscriptReceive(data.roomId, data.userId, data.content, new Date());
  }

  /**
   * Processes meeting transcripts (e.g., for analytics, search indexing, etc.)
   * @param roomId - ID of the room where the transcript was generated
   * @returns Status of the processing operation
   */
  @RabbitRPC({
    exchange: VIDEO_CHAT_EXCHANGE,
    routingKey: VIDEO_CHAT_PATTERN.PROCESS_TRANSCRIPT,
    queue: VIDEO_CHAT_PATTERN.PROCESS_TRANSCRIPT,
    errorHandler: customErrorHandler
  })
  async processMeetingSummary(roomId: string) {
    return await this.videoChatService.processMeetingSummary(roomId);
  }

  /**
   * Handles an answer from a client in a video call
   * @param data - Answer data
   * @param data.clientId - ID of the client sending the answer
   * @param data.sdp - SDP (Session Description Protocol) data for the answer
   * @param data.roomId - ID of the room where the answer was sent
   * @param data.targetId - ID of the target client for the answer
   * @returns Success status and answer confirmation
   */
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