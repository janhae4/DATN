import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.pattern';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ChatbotService } from './chatbot.service';
import { StorageService } from './storage.service';
import { CHATBOT_EXCHANGE, MessageDto } from '@app/contracts';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly storageService: StorageService,
  ) { }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.FIND_CONVERSATION,
    queue: CHATBOT_PATTERN.FIND_CONVERSATION,
  })
  async findConversation(payload: {
    userId: string;
    conversationId: string;
    page: number;
    limit: number;
  }) {
    return await this.chatbotService.findConversation(
      payload.userId,
      payload.conversationId,
      payload.page,
      payload.limit,
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.FIND_CONVERSATIONS,
    queue: CHATBOT_PATTERN.FIND_CONVERSATIONS,
  })
  async findAllConversation(payload: {
    userId: string;
    page: number;
    limit: number;
  }) {
    return await this.chatbotService.findAllConversation(
      payload.userId,
      payload.page,
      payload.limit,
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.DELETE_CONVERSATION,
    queue: CHATBOT_PATTERN.DELETE_CONVERSATION,
  })
  async deleteConversation(conversationId: string) {
    return await this.chatbotService.deleteConversation(conversationId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.UPLOAD_FILE,
    queue: CHATBOT_PATTERN.UPLOAD_FILE,
  })
  async uploadFile(payload: { file: Express.Multer.File; userId: string }) {
    return await this.storageService.uploadFile(payload.file, payload.userId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.GET_FILES_BY_USER_ID,
    queue: CHATBOT_PATTERN.GET_FILES_BY_USER_ID,
  })
  async getFilesByUserId(userId: string) {
    return await this.storageService.getFilesByUserId(userId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.DELETE_FILE,
    queue: CHATBOT_PATTERN.DELETE_FILE,
  })
  async deleteFile(fileId: string ) {
    return await this.storageService.deleteFile(fileId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
    queue: CHATBOT_PATTERN.HANDLE_MESSAGE,
  })
  async handleMessage(payload: MessageDto) {
    return await this.chatbotService.handleMessage(
      payload.userId,
      payload.message,
      payload.conversationId,
      payload.role,
    );
  }
}
