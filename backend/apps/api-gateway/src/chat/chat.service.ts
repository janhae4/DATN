import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
    CHAT_CLIENT,
    CHAT_PATTERN,
    CreateChatMessageDto,
    CreateDirectChatDto,
    GetChatMessageConversationDto,
} from '@app/contracts';

@Injectable()
export class ChatService {
    constructor(
        @Inject(CHAT_CLIENT) 
        private readonly chatClient: ClientProxy,
    ) { }

    createDirectChat(payload: CreateDirectChatDto) {
        return this.chatClient.send(CHAT_PATTERN.CREATE_DIRECT_MESSAGE, payload);
    }

    createChatMessage(payload: CreateChatMessageDto) {
        return this.chatClient.send(CHAT_PATTERN.CREATE_MESSAGE, payload);
    }

    getConversationsForUser(userId: string) {
        return this.chatClient.send(CHAT_PATTERN.GET, userId);
    }

    getMessagesForConversation(payload: GetChatMessageConversationDto) {
        return this.chatClient.send(CHAT_PATTERN.GET_MESSAGES, payload);
    }
}
