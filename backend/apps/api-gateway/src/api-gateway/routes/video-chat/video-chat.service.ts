import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { VIDEO_CHAT_CLIENT } from '@app/contracts/constants';
import { VIDEO_CHAT_PATTERNS } from '@app/contracts/video-chat/video-chat.patterns';
import { CreateCallDto } from '@app/contracts/video-chat/create-call.dto';

@Injectable()
export class VideoChatService {
    constructor(@Inject(VIDEO_CHAT_CLIENT) private readonly videoChatClient: ClientProxy) {}

    createCall(createCallDto: CreateCallDto) {
        return this.videoChatClient.send(VIDEO_CHAT_PATTERNS.CREATE_CALL, createCallDto);
    }

    getCallHistory(userId: string) {
        return this.videoChatClient.send(VIDEO_CHAT_PATTERNS.GET_CALL_HISTORY, userId);
    }

    getCallHistoryByRoomId(roomId: string) {
        return this.videoChatClient.send('get-call-history-by-room-id', roomId);
    }
}
