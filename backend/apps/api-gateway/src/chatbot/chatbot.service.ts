import { Injectable, Logger } from '@nestjs/common';

import {
  AiDiscussionDto,
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  ConversationResponseDto,
  MessageMetadataDto,
} from '@app/contracts';
import { unwrapRpcResult } from '../common/helper/rpc';
import { RmqClientService } from '@app/common';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private readonly amqp: RmqClientService,
  ) {
  }

  async askQuestion(question: string) {
    return unwrapRpcResult(await this.amqp.request<ConversationResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.ASK_QUESTION,
      payload: question,
    }));
  }

  processDocument(fileName: string, userId: string, teamId?: string) {
    this.amqp.publish(CHATBOT_EXCHANGE, CHATBOT_PATTERN.PROCESS_DOCUMENT, {
      fileName,
      userId,
      teamId
    });
    return {
      message: 'Tài liệu của bạn đã được tiếp nhận và đang được xử lý.',
    };
  }

  async uploadFile(file: Express.Multer.File, userId: string, teamId?: string) {
    const fileName = await this.amqp.request<string>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.UPLOAD_FILE,
      payload: { file, userId, teamId }
    })
    return unwrapRpcResult(fileName);
  }

  async getFilesPrefix(userId?: string, teamId?: string) {
    const files = await this.amqp.request<string[]>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.GET_FILES_BY_PREFIX,
      payload: { userId, teamId }
    })
    return unwrapRpcResult(files);
  }

  async deleteFile(fileId: string, userId: string, teamId?: string) {
    const file = await this.amqp.request<string>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.DELETE_FILE,
      payload: { userId, fileId, teamId }
    })
    return unwrapRpcResult(file)
  }

  async findTeamConversation(
    userId: string,
    teamId: string,
    page: number = 1,
    limit: number = 15
  ) {
    const conversations = await this.amqp.request<ConversationResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_TEAM_CONVERSATIONS,
      payload: { userId, teamId, page, limit },
    })
    return unwrapRpcResult(conversations);
  }

  async findAllConversation(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    const conversations = await this.amqp.request<ConversationResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_CONVERSATIONS,
      payload: { userId, page, limit },
    })
    return unwrapRpcResult(conversations)
  }

  async findConversation(
    userId: string,
    id: string,
    page: number = 1,
    limit: number = 15,
  ) {
    const conversations = await this.amqp.request<ConversationResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_CONVERSATION,
      payload: { userId, id, page, limit },
    })
    return unwrapRpcResult(conversations)
  }

  async deleteConversation(conversationId: string, userId: string, teamId?: string) {
    const conversation = await this.amqp.request<string>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.DELETE_CONVERSATION,
      payload: { conversationId, userId, teamId }
    })
    return unwrapRpcResult(conversation)
  }

  async getFile(fileId: string, userId: string, teamId?: string) {
    const base64Data = await this.amqp.request<string>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.GET_FILE_BY_ID,
      payload: { userId, fileId, teamId },
    });

    const fileBuffer = Buffer.from(base64Data, 'base64');
    console.log(fileBuffer)
    let contentType = 'application/octet-stream';

    if (fileId.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else {
      contentType = 'text/plain; charset=utf-8';
    }

    return {
      data: fileBuffer,
      contentType
    }

  }

  async updateFile(file: Express.Multer.File, fileId: string, userId: string, teamId?: string) {
    const updatedFile = await this.amqp.request<string>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.UPDATE_FILE,
      payload: { file, userId, fileId, teamId }
    })
    return unwrapRpcResult(updatedFile)
  }

  async renameFile(fileId: string, newName: string, userId: string, teamId?: string) {
    const result = await this.amqp.request<string>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.RENAME_FILE,
      payload: { userId, fileId, newName, teamId }
    })
    const res = unwrapRpcResult(result)
    return { newFileId: res }
  }

  async sendMessage(payload: {
    userId: string,
    message: string,
    conversationId?: string,
    teamId?: string
  }) {
    const result = await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
      payload
    })
    return unwrapRpcResult(result)
  }

  async handleMessage(message: string, discussionId: string, userId: string, summarizeFileName?: string) {
    this.logger.log(`Received new message for ${discussionId}. Sender: ${userId}`);
    console.log("User ID:", userId);
    const result = await this.amqp.request<AiDiscussionDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
      payload: { message, discussionId, userId, summarizeFileName }
    })
    return unwrapRpcResult(result)
  }

  async saveAiMessage(discussionId: string, message: string, metadata?: MessageMetadataDto) {
    return unwrapRpcResult(await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.CREATE,
      payload: { discussionId, message, metadata }
    }))
  }
}
