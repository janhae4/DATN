import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Aggregate, Model } from 'mongoose';
import {
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  Conversation,
  ConversationDocument,
  INGESTION_CLIENT,
  Message,
  NotFoundException,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  constructor(
    private readonly amqp: AmqpConnection,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
  ) { }

  async handleMessage(
    userId: string,
    message: string,
    conversationId?: string,
    role: 'user' | 'ai' = 'user',
  ): Promise<ConversationDocument> {
    let conversation: ConversationDocument;

    if (conversationId) {
      conversation = (await this.conversationModel.findById(
        conversationId,
      )) as ConversationDocument;
      this.logger.log(`Conversation ${conversationId} found`);
    } else {
      conversation = new this.conversationModel({
        user_id: userId,
        title: message.substring(0, 30) + '...',
      });
      this.logger.log(`Conversation ${String(conversation._id)} created`);
    }

    const messageDoc = {
      role,
      content: message,
    } as Message;

    conversation.messages.push(messageDoc);
    await conversation.save();
    this.logger.log(
      `Message ${messageDoc.content.substring(0, 5) + '...'} added to conversation ${String(conversation._id)}`,
    );
    return conversation;
  }

  async findAllConversation(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log('');
    const skip = (page - 1) * limit;
    const dataQuery = this.conversationModel
      .find({ user_id: userId })
      .select('title _id')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const totalQuery = this.conversationModel
      .countDocuments({
        user_id: userId,
      })
      .exec();
    const [total, data] = await Promise.all([totalQuery, dataQuery]);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findConversation(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log(`Find conversation ${conversationId} from ${userId}`);
    const skip = (page - 1) * limit;
    const _id = new mongoose.Types.ObjectId(conversationId);
    const results = await this.conversationModel.aggregate<
      Aggregate<ConversationDocument>
    >([
      { $match: { _id, user_id: userId } },
      {
        $project: {
          title: 1,
          user_id: 1,
          createdAt: 1,
          updatedAt: 1,
          totalMessage: { $size: '$messages' },
          messages: { $slice: ['$messages', skip, limit] },
        },
      },
    ]);

    if (!results || results.length === 0) {
      throw new NotFoundException('Conversation not found');
    }

    const conversation = results[0];

    return {
      data: conversation,
      page,
      limit,
      totalPages: Math.ceil((await conversation).messages.length / limit),
    };
  }

  async deleteConversation(conversationId: string) {
    return await this.conversationModel.findByIdAndDelete(conversationId);
  }
}
