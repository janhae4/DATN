import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  CHATBOT_CLIENT,
  CHATBOT_PATTERN,
  ConversationResponseDto,
} from '@app/contracts';

@Injectable()
export class ChatbotService {
  constructor(
    @Inject(CHATBOT_CLIENT) private readonly chatbotClient: ClientProxy,
  ) {}

  askQuestion(question: string) {
    return this.chatbotClient.send(CHATBOT_PATTERN.ASK_QUESTION, { question });
  }

  processDocument(fileName: string, userId: string) {
    console.log(`${fileName} \t ${userId}`);
    this.chatbotClient.emit(CHATBOT_PATTERN.PROCESS_DOCUMENT, {
      fileName,
      userId,
    });
    return {
      message: 'Tài liệu của bạn đã được tiếp nhận và đang được xử lý.',
    };
  }

  async uploadFile(file: Express.Multer.File, userId: string) {
    try {
      const fileName = await firstValueFrom<string>(
        this.chatbotClient.send(CHATBOT_PATTERN.UPLOAD_FILE, { file, userId }),
      );
      return fileName;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async getFilesByUserId(userId: string) {
    try {
      const files = await firstValueFrom<string[]>(
        this.chatbotClient.send(CHATBOT_PATTERN.GET_FILES_BY_USER_ID, userId),
      );
      return files;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async deleteFile(fileId: string) {
    try {
      const files = await firstValueFrom<string[]>(
        this.chatbotClient.send(CHATBOT_PATTERN.DELETE_FILE, { fileId }),
      );
      return files;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async findAllConversation(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    try {
      const conversations = await firstValueFrom<ConversationResponseDto>(
        this.chatbotClient.send(CHATBOT_PATTERN.FIND_CONVERSATIONS, {
          userId,
          page,
          limit,
        }),
      );
      return conversations;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async findConversation(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    try {
      const conversations = await firstValueFrom<ConversationResponseDto>(
        this.chatbotClient.send(CHATBOT_PATTERN.FIND_CONVERSATION, {
          userId,
          conversationId,
          page,
          limit,
        }),
      );
      return conversations;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async deleteConversation(conversationId: string) {
    try {
      const conversations = await firstValueFrom<ConversationResponseDto>(
        this.chatbotClient.send(CHATBOT_PATTERN.DELETE_CONVERSATION, {
          conversationId,
        }),
      );
      return conversations;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }
}
