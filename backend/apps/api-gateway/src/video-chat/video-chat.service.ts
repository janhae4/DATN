import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  CreateCallDto,
  VIDEO_CHAT_EXCHANGE,
  VIDEO_CHAT_PATTERN,
} from '@app/contracts';

@Injectable()
export class VideoChatService {
  constructor(private readonly amqpConnection: AmqpConnection) { }

  async createOrJoinCall(createCallDto: CreateCallDto) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.CREATE_CALL,
      payload: createCallDto,
      timeout: 10000,
    });
  }

  async getCallHistory(userId: string) {
    return this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.GET_HISTORY,
      payload: userId,
    });
  }

  async getCallHistoryByRoomId(roomId: string) {
    return this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.GET_HISTORY_BY_ROOM,
      payload: { roomId },
    });
  }

  async handleTranscriptReceive(roomId: string, userId: string, content: string, timestamp: Date) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.RECEIVE_TRANSCRIPT,
      payload: { roomId, userId, content, timestamp },
    });
  }

  async processMeetingSummary(roomId: string) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.PROCESS_TRANSCRIPT,
      payload: roomId,
    });
  }

  async kickUser(requesterId: string, targetUserId: string, roomId: string) {
    console.log("kickUser", requesterId, targetUserId, roomId);
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.KICK_USER,
      payload: { requesterId, targetUserId, roomId },
    });
  }

  async unKickUser(requesterId: string, targetUserId: string, roomId: string) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.UNKICK_USER,
      payload: { requesterId, targetUserId, roomId },
    });
  }


  // notifyUser(userId: string, message: string) {
  //   this.amqpConnection.publish(
  //     VIDEO_CHAT_EXCHANGE,
  //     VIDEO_CHAT_PATTERN.NOTIFY_USER,
  //     { userId, message },
  //   );
  // }
}