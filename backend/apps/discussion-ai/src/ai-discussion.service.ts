import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { FilterQuery, Model } from 'mongoose';
import {
  AiMessageSnapshot,
  BadRequestException,
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  CreateTeamEventPayload,
  ForbiddenException,
  MemberShip,
  MessageMetadataDto,
  NotFoundException,
  REDIS_EXCHANGE,
  REDIS_PATTERN,
  RemoveTeamEventPayload,
  SEARCH_EXCHANGE,
  SEARCH_PATTERN,
  SendAiMessageEventPayload,
  SENDER_SNAPSHOT_AI,
  SenderSnapshotDto,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  USER_EXCHANGE,
  USER_PATTERNS,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { AiDiscussion, TeamSnapshot } from './schema/ai-discussion.schema';
import { AiMessage } from './schema/message.schema';
import Redis from 'ioredis';

@Injectable()
export class AiDiscussionService {
  private readonly logger = new Logger(AiDiscussionService.name);

  constructor(
    @InjectModel(AiDiscussion.name)
    private aiDiscussionModel: Model<AiDiscussion>,
    @InjectModel(AiMessage.name)
    private aiMessageModel: Model<AiMessage>,
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    private readonly amqp: AmqpConnection,
    @Inject(REDIS_EXCHANGE) private readonly redis: Redis
  ) { }

  private createLatestMessageSnapshot(messageDoc: AiMessage): AiMessageSnapshot {
    return {
      _id: messageDoc._id?.toString() as string,
      content: messageDoc.content,
      sender: messageDoc.sender as SenderSnapshotDto,
      metadata: messageDoc.metadata as MessageMetadataDto,
      createdAt: messageDoc.timestamp,
    };
  }

  private async findDiscussionByContext(
    userId: string,
    teamId?: string,
  ): Promise<AiDiscussion | null> {

    let query: FilterQuery<AiDiscussion>;

    if (teamId) {
      this.logger.log(`Finding discussion for team ${teamId}`);
      query = { teamId: teamId };
    } else {
      this.logger.log(`Finding 1-on-1 discussion for user ${userId}`);
      query = {
        ownerId: userId,
        teamId: { $exists: false }
      };
    }

    return await this.aiDiscussionModel.findOne(query);
  }

  private async checkDiscussionAuth(options: {
    userId: string;
    discussionId?: string;
    teamId?: string;
  }
  ): Promise<AiDiscussion> {
    const { userId, discussionId, teamId } = options;
    console.log("Checking discussion auth with options:", options);
    let discussion: AiDiscussion | null;
    if (!discussionId) {
      if (!teamId) {
        discussion = await this.aiDiscussionModel.findOne({ ownerId: userId, teamId: { $exists: false } });
      }
      else {
        discussion = await this.aiDiscussionModel.findOne({ teamId: teamId });
      }
    }
    else {
      discussion = await this.aiDiscussionModel.findById(discussionId);
    }

    if (!discussion || discussion.isDeleted) {
      throw new NotFoundException('Discussion not found or deleted');
    }

    if (!discussion.teamId) {
      if (discussion.ownerId === userId) {
        return discussion;
      }
    }

    if (discussion.teamId) {
      try {
        const role = await this.amqp.request({
          exchange: TEAM_EXCHANGE,
          routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
          payload: { userId, teamId: discussion.teamId },
        })

        if (role) {
          return discussion;
        }
      } catch (error) {
        this.logger.error(`Failed to check role via AMQP: ${error.message}`);
      }
    }

    throw new ForbiddenException('You do not have permission to access this discussion.');
  }

  private async getSenderSnapshot(userId: string): Promise<SenderSnapshotDto> {
    try {
      const senders = await this.amqp.request<SenderSnapshotDto[]>({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
        payload: { userIds: [userId], forDiscussion: true },
      });

      if (!senders || senders.length === 0) {
        throw new NotFoundException(`User with ID ${userId} not found.`);
      }
      return senders[0];
    } catch (error) {
      this.logger.error(`Failed to get sender snapshot for user ${userId}: ${error.message}`);
      throw new BadRequestException('Failed to retrieve user data.');
    }
  }

  private async saveMessageToDiscussion(
    sender: SenderSnapshotDto,
    message: string,
    teamId: string | undefined,
    metadata: MessageMetadataDto | undefined,
    discussionId: string | undefined,
  ): Promise<AiDiscussion> {
    if (discussionId) {
      console.log("Adding message to existing discussion...");
      return this.addMessageToExistingDiscussion(
        sender,
        discussionId,
        message,
        metadata,
      );
    } else {
      this.logger.log("Creating new discussion with message...");
      const discussion = await this.createNewDiscussionWithMessage(
        sender,
        teamId,
        message,
        metadata,
      );
      this.logger.log(`New discussion created with ID: ${discussion._id}`);
      return discussion;
    }
  }

  private async getMembersToNotify(discussion: AiDiscussion): Promise<string[]> {
    if (discussion.teamId) {
      try {
        const memberIds = await this.amqp.request<string[]>({
          exchange: TEAM_EXCHANGE,
          routingKey: TEAM_PATTERN.FIND_PARTICIPANTS_IDS,
          payload: { teamId: discussion.teamId },
        });
        return memberIds || [];
      } catch (error) {
        this.logger.error(`Failed to get team members for ${discussion.teamId}: ${error.message}`);
        return [];
      }
    } else if (discussion.ownerId) {
      return [discussion.ownerId];
    }
    return [];
  }

  private async publishToChatbotService(
    discussion: AiDiscussion,
    sender: SenderSnapshotDto,
    message: string,
    membersToNotify: string[],
    summarizeFileName?: string,
    socketId?: string,
  ) {
    const requestPayload = {
      userId: sender._id,
      teamId: discussion.teamId,
      discussionId: discussion._id?.toString(),
      socketId,
      membersToNotify,
    };

    if (summarizeFileName) {
      this.logger.log(`Emitting to RAG_CLIENT (summarize_document) for user ${sender._id}.`);
      this.amqp.publish(
        CHATBOT_EXCHANGE,
        CHATBOT_PATTERN.SUMMARIZE_DOCUMENT,
        { ...requestPayload, summarizeFileName },
      );
    } else {
      const chatHistory = await this.getChatHistory(discussion._id as mongoose.Types.ObjectId, sender._id);
      this.amqp.publish(
        CHATBOT_EXCHANGE,
        CHATBOT_PATTERN.ASK_QUESTION,
        { ...requestPayload, question: message, chatHistory },
      );
    }
  }

  private async getChatHistory(discussionId: mongoose.Types.ObjectId, senderId: string) {
    const historyDocs = await this.aiMessageModel
      .find({ discussionId })
      .limit(20)
      .sort({ timestamp: -1 })
      .select('content sender')
      .lean();

    return (historyDocs || [])
      .map((msg) => ({
        role: msg.sender._id === senderId ? 'user' : 'ai',
        content: msg.content,
      }))
      .reverse();
  }

  async handleMessage(
    userId: string,
    message: string,
    teamId?: string,
    metadata?: MessageMetadataDto,
    discussionId?: string,
    summarizeFileName?: string,
    socketId?: string,
  ) {
    const sender = await this.getSenderSnapshot(userId);

    try {
      const aiDiscussion = await this.saveMessageToDiscussion(
        sender,
        message,
        teamId,
        metadata,
        discussionId,
      );

      if (!aiDiscussion || !aiDiscussion.latestMessageSnapshot) {
        throw new BadRequestException('Failed to process message.');
      }

      const membersToNotify = await this.getMembersToNotify(aiDiscussion);
      this.logger.log(`Members to notify: ${membersToNotify.length}`);

      await this.publishToChatbotService(
        aiDiscussion,
        sender,
        message,
        membersToNotify,
        summarizeFileName,
        socketId,
      );

      this.publishMessageEvent(
        aiDiscussion,
        aiDiscussion.latestMessageSnapshot as AiMessageSnapshot,
      );

      return aiDiscussion;

    } catch (error) {
      this.logger.error(
        `Failed to handle message for user ${sender._id}: ${error.message}`,
      );
      if (error.getStatus) {
        throw error;
      }
      throw new BadRequestException(
        'An error occurred while handling the message.',
      );
    }
  }

  async handleMessageForUser(
    userId: string,
    message: string,
    metadata?: MessageMetadataDto,
    discussionId?: string,
    summarizeFileName?: string
  ) {
    const sender = await this.getSenderSnapshot(userId);
    try {
      const aiDiscussion = await this.saveMessageToDiscussion(
        sender,
        message,
        undefined,
        metadata,
        discussionId,
      );

      await this.publishToChatbotService(
        aiDiscussion,
        sender,
        message,
        [],
        summarizeFileName,
        undefined,
      );
      return aiDiscussion;
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
      throw new BadRequestException('Process message failed');
    }
  }

  async saveAiMessage(
    discussionId: string,
    message: string,
    metadata?: MessageMetadataDto,
  ) {
    const messageDoc = new this.aiMessageModel({
      discussionId,
      sender: {
        _id: SENDER_SNAPSHOT_AI.id,
        name: SENDER_SNAPSHOT_AI.name,
        avatar: SENDER_SNAPSHOT_AI.avatar,
        status: MemberShip.ACTIVE
      },
      content: message,
      metadata,
    });
    const savedMessage = await messageDoc.save();

    return savedMessage;
  }

  private async addMessageToExistingDiscussion(
    sender: SenderSnapshotDto,
    discussionId: string,
    message: string,
    metadata: MessageMetadataDto | undefined,
  ): Promise<AiDiscussion> {
    const discussion = await this.checkDiscussionAuth({ userId: sender._id, discussionId });
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const messageDoc = new this.aiMessageModel({
        discussionId: discussion._id,
        sender: sender,
        content: message,
        metadata,
      });
      const [savedMessage] = await this.aiMessageModel.create([messageDoc], { session });

      const latestSnapshot = this.createLatestMessageSnapshot(savedMessage);

      const updatedDiscussion = await this.aiDiscussionModel.findByIdAndUpdate(
        discussionId,
        {
          latestMessage: savedMessage._id,
          latestMessageSnapshot: latestSnapshot,
        },
        { new: true, session },
      );

      await session.commitTransaction();

      if (!updatedDiscussion) {
        throw new BadRequestException('Failed to save message.');
      }
      this.logger.log(`Message added to existing AiDiscussion ${updatedDiscussion._id}`);
      return updatedDiscussion;

    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction aborted: ${error.message}`);
      throw new BadRequestException('Failed to save message.');
    } finally {
      session.endSession();
    }
  }

  private async createNewDiscussionWithMessage(
    sender: SenderSnapshotDto,
    teamId: string | undefined,
    message: string,
    metadata: MessageMetadataDto | undefined,
  ): Promise<AiDiscussion> {

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const newConvData: Partial<AiDiscussion> = {
        name: message.substring(0, 30) + '...',
        teamId: teamId,
        ownerId: teamId ? undefined : sender._id,
      };
      this.logger.log("Creating AiDiscussion with data:", newConvData);
      const [discussion] = await this.aiDiscussionModel.create([newConvData], { session });
      this.logger.log(`AiDiscussion created with ID: ${discussion._id}`);
      const messageDoc = new this.aiMessageModel({
        discussionId: discussion._id,
        sender,
        content: message,
        metadata,
      });
      const [savedMessage] = await this.aiMessageModel.create([messageDoc], { session });

      const latestSnapshot = this.createLatestMessageSnapshot(savedMessage);

      discussion.latestMessage = savedMessage._id;
      discussion.latestMessageSnapshot = latestSnapshot;
      await discussion.save({ session });

      await session.commitTransaction();
      this.logger.log(`AiDiscussion ${discussion._id} created`);
      return discussion;

    } catch (error) {
      await session.abortTransaction();
      this.logger.error(`Transaction aborted: ${error.message}`);
      throw new BadRequestException('Failed to create discussion.');
    } finally {
      session.endSession();
    }
  }

  private publishMessageEvent(
    discussion: AiDiscussion,
    message: AiMessageSnapshot,
  ): void {
    if (!message) return;

    try {
      const payload: SendAiMessageEventPayload = {
        sender: message.sender,
        message: message.content,
        discussionId: discussion._id?.toString(),
        teamId: discussion.teamId,
        metadata: message.metadata,
      };

      this.amqp.publish(
        SEARCH_EXCHANGE,
        SEARCH_PATTERN.NEW_MESSAGE_CHATBOT,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish message event for AiDiscussion ${discussion._id}: ${error}`
      )
    }
  }


  async createTeam(payload: CreateTeamEventPayload) {
    const { teamSnapshot, createdAt, owner } = payload;
    const { name, id: teamId } = teamSnapshot;

    await this.aiDiscussionModel.create({
      name,
      teamId,
      teamSnapshot,
      ownerId: owner.id,
    } as AiDiscussion)

    this.logger.log(`Team AI Discussion for ${name} created`);
  }

  async findTeamDiscussion(
    userId: string,
    teamId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log(`Find Discussion for team ${teamId} from ${userId}`);
    const skip = (page - 1) * limit;

    const discussion = await this.checkDiscussionAuth({ userId, teamId });

    const messagesQuery = this.aiMessageModel
      .find({ discussionId: discussion._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalQuery = this.aiMessageModel.countDocuments({ discussionId: discussion._id });

    const [messages, totalMessages] = await Promise.all([messagesQuery, totalQuery]);

    const data = {
      ...discussion,
      messages: messages.reverse(),
      totalMessage: totalMessages,
    };

    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(totalMessages / limit),
    };
  }

  async findAllDiscussion(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log(`Finding all 1-1 discussions for user ${userId}`);
    const skip = (page - 1) * limit;

    const query: FilterQuery<AiDiscussion> = {
      ownerId: userId,
      teamId: { $exists: false },
      isDeleted: { $ne: true }
    };

    const dataQuery = this.aiDiscussionModel
      .find(query)
      .select('name _id latestMessageSnapshot updatedAt')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const totalQuery = this.aiDiscussionModel.countDocuments(query);

    const [data, total] = await Promise.all([dataQuery, totalQuery]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages
    };
  }


  async findDiscussion(
    userId: string,
    page: number = 1,
    limit: number = 15,
    id: string
  ) {

    const skip = (page - 1) * limit;

    const discussion = await this.aiDiscussionModel.findOne({
      _id: id,
      ownerId: userId,
      isDeleted: false
    }).lean()

    if (!discussion) {
      throw new NotFoundException('Discussion not found or access denied');
    }
    console.log("Discussion found:", discussion);
    const messagesQuery = this.aiMessageModel
      .find({ discussionId: id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const totalQuery = this.aiMessageModel.countDocuments({ discussionId: discussion._id });

    const [messages, totalMessages] = await Promise.all([messagesQuery, totalQuery]);

    const data = {
      messages: messages.reverse(),
      totalMessage: totalMessages,
    };

    console.log(data)

    return {
      data,
      page,
      limit,
      totalPages: Math.ceil(totalMessages / limit),
    };
  }

  async deleteDiscussion(discussionId: string, userId: string) {
    try {

      await Promise.all([
        this.aiDiscussionModel.findOneAndUpdate(
          {
            _id: discussionId,
            ownerId: userId,
            isDeleted: false
          },
          {
            $set: { isDeleted: true }
          },
          { new: true }
        ),
        this.aiMessageModel.deleteMany({ discussionId: discussionId }),
      ]);

      return { message: 'Discussion deleted' };
    } catch (error) {
      this.logger.error(`Failed to delete discussion ${discussionId}: ${error.message}`);
      throw error;
    }
  }

  async removeTeam(payload: RemoveTeamEventPayload) {
    const { teamId } = payload;
    this.logger.warn(`DELETING all RAG Discussions for team ${teamId}`);

    const discussion = await this.aiDiscussionModel.findOne({ teamId });
    if (!discussion) {
      this.logger.warn(`No discussion found for team ${teamId}, skipping...`);
      return;
    }

    await this.aiDiscussionModel.findOneAndUpdate(
      { teamId },
      { $set: { isDeleted: true } },
      { new: true }
    );

    this.amqp.publish(
      CHATBOT_EXCHANGE,
      CHATBOT_PATTERN.REMOVE_COLLECTION,
      { teamId }
    )
  }
}