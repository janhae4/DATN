import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  ConversationResponseDto,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ChatbotService {
  constructor(
    private readonly amqp: AmqpConnection,
  ) { }

  async askQuestion(question: string) {
    return await this.amqp.request<ConversationResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.ASK_QUESTION,
      payload: question,
    });
  }

  processDocument(fileName: string, userId: string) {
    this.amqp.publish(CHATBOT_EXCHANGE, CHATBOT_PATTERN.PROCESS_DOCUMENT, {
      fileName,
      userId,
    });
    return {
      message: 'Tài liệu của bạn đã được tiếp nhận và đang được xử lý.',
    };
  }

  async uploadFile(file: Express.Multer.File, userId: string) {
    try {
      const fileName = await this.amqp.request<string>({
        exchange: CHATBOT_EXCHANGE,
        routingKey: CHATBOT_PATTERN.UPLOAD_FILE,
        payload: { file, userId }
      })
      return fileName;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async getFilesByUserId(userId: string) {
    try {
      const files = await this.amqp.request<string[]>({
          exchange: CHATBOT_EXCHANGE,
          routingKey: CHATBOT_PATTERN.GET_FILES_BY_USER_ID,
          payload: userId
        })
      return files;
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async deleteFile(fileId: string) {
    try {
      return await this.amqp.request<string>({
        exchange: CHATBOT_EXCHANGE,
        routingKey: CHATBOT_PATTERN.DELETE_FILE,
        payload: fileId
      })
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
      return await this.amqp.request<ConversationResponseDto>({
        exchange: CHATBOT_EXCHANGE,
        routingKey: CHATBOT_PATTERN.FIND_CONVERSATIONS,
        payload: { userId, page, limit },
      })
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
      return await this.amqp.request<ConversationResponseDto>({
        exchange: CHATBOT_EXCHANGE,
        routingKey: CHATBOT_PATTERN.FIND_CONVERSATION,
        payload: { userId, conversationId, page, limit },
      })
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }

  async deleteConversation(conversationId: string) {
    try {
      return await this.amqp.request<string>({
        exchange: CHATBOT_EXCHANGE,
        routingKey: CHATBOT_PATTERN.DELETE_CONVERSATION,
        payload: conversationId
      })
    } catch (err) {
      const e = err as Error;
      throw new BadRequestException(e.message);
    }
  }
}
