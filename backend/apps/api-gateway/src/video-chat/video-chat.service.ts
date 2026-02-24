import { Injectable } from '@nestjs/common';
import {
  CreateCallDto,
  VIDEO_CHAT_EXCHANGE,
  VIDEO_CHAT_PATTERN,
} from '@app/contracts';
import { RmqClientService } from '@app/common';

@Injectable()
export class VideoChatService {
  constructor(private readonly amqpConnection: RmqClientService) { }

  async createOrJoinCall(createCallDto: CreateCallDto) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.CREATE_CALL,
      payload: createCallDto,
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

  async getCallHistoryByTeamId(teamId: string, userId: string, page: number = 1, limit: number = 10) {
    return this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.GET_HISTORY_BY_TEAM,
      payload: { teamId, userId, page: Number(page), limit: Number(limit) },
    });
  }

  async getActionItems(callId: string, page: number = 1, limit: number = 10) {
    return this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.GET_ACTION_ITEMS,
      payload: { callId, page: Number(page), limit: Number(limit) },
    });
  }

  async getRecordings(callId: string, page: number = 1, limit: number = 10) {
    return this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.GET_RECORDINGS,
      payload: { callId, page: Number(page), limit: Number(limit) },
    });
  }

  async getTranscripts(callId: string, page: number = 1, limit: number = 20) {
    return this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.GET_TRANSCRIPTS,
      payload: { callId, page: Number(page), limit: Number(limit) },
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

  async getCallInfo(roomId: string, userId: string) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.GET_CALL,
      payload: { roomId, userId },
    });
  }

  async updateActionItem(itemId: string, data: any) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.UPDATE_ACTION_ITEM,
      payload: { itemId, ...data },
    });
  }

  async deleteActionItem(itemId: string) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.DELETE_ACTION_ITEM,
      payload: { itemId },
    });
  }

  async bulkUpdateActionItems(callId: string, status: string) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.BULK_UPDATE_ACTION_ITEMS,
      payload: { callId, status },
    });
  }

  async bulkDeleteActionItems(callId: string) {
    return await this.amqpConnection.request<any>({
      exchange: VIDEO_CHAT_EXCHANGE,
      routingKey: VIDEO_CHAT_PATTERN.BULK_DELETE_ACTION_ITEMS,
      payload: { callId },
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