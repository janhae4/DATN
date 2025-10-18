import {
  CreateCallDto,
  VIDEO_CHAT_CLIENT,
  VIDEO_CHAT_PATTERNS,
} from '@app/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class VideoChatService {
  constructor(
    @Inject(VIDEO_CHAT_CLIENT) private readonly videoChatClient: ClientProxy,
  ) {}

  createCall(createCallDto: CreateCallDto) {
    return this.videoChatClient.send(
      VIDEO_CHAT_PATTERNS.CREATE_CALL,
      createCallDto,
    );
  }

  getCallHistory(userId: string) {
    return this.videoChatClient.send(
      VIDEO_CHAT_PATTERNS.GET_CALL_HISTORY,
      userId,
    );
  }

  getCallHistoryByRoomId(roomId: string) {
    return this.videoChatClient.send('get-call-history-by-room-id', roomId);
  }
}
