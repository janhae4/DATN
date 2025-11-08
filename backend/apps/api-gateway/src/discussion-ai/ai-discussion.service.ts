import { BadRequestException, Injectable } from '@nestjs/common';

import {
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  DiscussionResponseDto,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class AiDiscussionService {
  constructor(
    private readonly amqp: AmqpConnection,
  ) { }

  async askQuestion(question: string) {
    return unwrapRpcResult(await this.amqp.request<DiscussionResponseDto>({
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

  async findTeamDiscussion(
    userId: string,
    teamId: string,
    page: number = 1,
    limit: number = 15
  ) {
    const discussions = await this.amqp.request<DiscussionResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_TEAM_CONVERSATIONS,
      payload: { userId, teamId, page, limit },
    })
    return unwrapRpcResult(discussions);
  }

  async findAllDiscussion(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    const discussions = await this.amqp.request<DiscussionResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_CONVERSATIONS,
      payload: { userId, page, limit },
    })
    return unwrapRpcResult(discussions)
  }

  async findDiscussion(
    userId: string,
    page: number = 1,
    limit: number = 15,
    discussionId?: string,
    teamId?: string
  ) {
    console.log(`ChatbotService: Finding discussion ${discussionId} for user ${userId} with teamId:`, teamId);
    const discussions = await this.amqp.request<DiscussionResponseDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.FIND_CONVERSATION,
      payload: { userId, discussionId, page, limit, teamId },
    })
    return unwrapRpcResult(discussions)
  }

  async deleteDiscussion(discussionId: string, userId: string, teamId?: string) {
    const discussion = await this.amqp.request<string>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.DELETE_CONVERSATION,
      payload: { discussionId, userId, teamId }
    })
    return unwrapRpcResult(discussion)
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
    discussionId?: string,
    teamId?: string
  }) {
    const result = await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
      payload
    })
    return unwrapRpcResult(result)
  }

  async getMessages(
    userId: string,
    page: number = 1,
    limit: number = 15,
    discussionId?: string,
    teamId?: string
  ) {
    const messages = await this.amqp.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.GET_MESSAGES,
      payload: { userId, discussionId, page, limit, teamId },
    })
    return unwrapRpcResult(messages)
  }
}
