import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.pattern';
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ChatbotService } from './chatbot.service';
import { StorageService } from './storage.service';
import { MessageDto } from '@app/contracts';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly storageService: StorageService,
  ) {}

  @MessagePattern(CHATBOT_PATTERN.PROCESS_DOCUMENT)
  processDocument(payload: { fileName: string; userId: string }) {
    return this.chatbotService.processDocument(
      payload.fileName,
      payload.userId,
    );
  }

  @MessagePattern(CHATBOT_PATTERN.FIND_CONVERSATION)
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

  @MessagePattern(CHATBOT_PATTERN.FIND_CONVERSATIONS)
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

  @MessagePattern(CHATBOT_PATTERN.DELETE_CONVERSATION)
  async deleteConversation(payload: { conversationId: string }) {
    return await this.chatbotService.deleteConversation(payload.conversationId);
  }

  @MessagePattern(CHATBOT_PATTERN.UPLOAD_FILE)
  async uploadFile(payload: { file: Express.Multer.File; userId: string }) {
    return await this.storageService.uploadFile(payload.file, payload.userId);
  }

  @MessagePattern(CHATBOT_PATTERN.GET_FILES_BY_USER_ID)
  async getFilesByUserId(userId: string) {
    return await this.storageService.getFilesByUserId(userId);
  }

  @MessagePattern(CHATBOT_PATTERN.DELETE_FILE)
  async deleteFile(payload: { fileId: string }) {
    return await this.storageService.deleteFile(payload.fileId);
  }

  @MessagePattern(CHATBOT_PATTERN.ASK_QUESTION)
  async handleMessage(payload: MessageDto) {
    return await this.chatbotService.handleMessage(
      payload.userId,
      payload.message,
      payload.conversationId,
      payload.role,
    );
  }
}
