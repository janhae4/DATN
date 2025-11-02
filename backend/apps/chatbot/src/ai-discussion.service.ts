import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Aggregate, FilterQuery, Model } from 'mongoose';
import {
  AddMemberEventPayload,
  AiMessageSnapshot,
  BadRequestException,
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  CreateTeamEventPayload,
  LeaveMember,
  MemberRole,
  MessageMetadataDto,
  NotFoundException,
  RemoveMemberEventPayload,
  RemoveTeamEventPayload,
  SEARCH_EXCHANGE,
  SEARCH_PATTERN,
  SendAiMessageEventPayload,
  Team,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  User,
  USER_EXCHANGE,
  USER_PATTERNS,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ParticipantDto } from '@app/contracts';
import { AiDiscussion, TeamSnapshot } from './schema/ai-discussion.schema';
import { AiMessage, SenderSnapshot } from './schema/message.schema';

@Injectable()
export class AiDiscussionService {
  private readonly logger = new Logger(AiDiscussionService.name);

  constructor(
    @InjectModel(AiDiscussion.name)
    private aiDiscussionModel: Model<AiDiscussion>,
    @InjectModel(AiMessage.name)
    private aiMessageModel: Model<AiMessage>,
    private readonly amqp: AmqpConnection,
  ) { }


  async handleMessage(
    sender: ParticipantDto,
    message: string,
    discussionId?: string,
    teamId?: string,
    metadata?: MessageMetadataDto,
  ): Promise<AiDiscussion | null> {
    let aiDiscussion: AiDiscussion | null;

    try {
      if (discussionId) {
        aiDiscussion = await this.addMessageToExistingDiscussion(
          sender,
          discussionId,
          teamId,
          message,
          metadata,
        );
      } else {
        aiDiscussion = await this.createNewDiscussionWithMessage(
          sender,
          teamId,
          message,
          metadata,
        );
      }

      if (!aiDiscussion) {
        this.logger.error('Discussion processing returned null unexpectedly.');
        throw new BadRequestException('Failed to process message.');
      }

      const newMessage = aiDiscussion.latestMessage;
      
      if (!newMessage) {
        this.logger.error(
          `FATAL: Discussion ${aiDiscussion._id} has no messages after update.`,
        );
        throw new BadRequestException('Failed to retrieve new message ID.');
      }

      this.publishMessageEvent(
        newMessage,
        (aiDiscussion._id as mongoose.Types.ObjectId).toString(),
        aiDiscussion.teamId,
      );

      return aiDiscussion;
    } catch (error) {
      this.logger.error(
        `Failed to handle message for user ${sender._id}: ${error}`
      );
      if (error.getStatus) {
        throw error;
      }
      throw new BadRequestException(
        'An error occurred while handling the message.',
      );
    }
  }

  private async addMessageToExistingDiscussion(
    sender: ParticipantDto,
    discussionId: string,
    teamId: string | undefined,
    message: string,
    metadata: MessageMetadataDto | undefined,
  ): Promise<AiDiscussion> {

    const query: FilterQuery<AiDiscussion> = { _id: discussionId };
    if (teamId) {
      query.teamId = teamId;
    } else {
      query.userId = sender._id;
      query.teamId = { $exists: false };
    }

    const existingDiscussion = await this.aiDiscussionModel.findOne(query, { _id: 1 });

    if (!existingDiscussion) {
      this.logger.warn(
        `Failed to find AiDiscussion ${discussionId} for user ${sender._id} or team ${teamId}`,
      );
      throw new NotFoundException(
        'AiDiscussion not found or you do not have permission.',
      );
    }

    const messageDoc: AiMessage = {
      sender: sender as any,
      content: message,
      timestamp: new Date(),
      metadata,
    };

    const updatedDiscussion = await this.aiDiscussionModel.findByIdAndUpdate(
      discussionId,
      { $push: { messages: messageDoc } },
      { new: true },
    );

    if (!updatedDiscussion) {
      this.logger.error(
        `Failed to update AiDiscussion ${discussionId} after finding it.`,
      );
      throw new BadRequestException('Failed to save message.');
    }

    this.logger.log(
      `Message added to existing AiDiscussion ${updatedDiscussion._id}`,
    );
    return updatedDiscussion;
  }

  private async createNewDiscussionWithMessage(
    sender: ParticipantDto,
    teamId: string | undefined,
    message: string,
    metadata: MessageMetadataDto | undefined,
  ): Promise<AiDiscussion> {

    const messageDoc: AiMessage = {
      sender: sender as SenderSnapshot,
      content: message,
      metadata,
      timestamp: new Date(),
    };

    const savedMessage = await this.aiMessageModel.create(messageDoc);

    const newConvData: Partial<AiDiscussion> = {
      name: message.substring(0, 30) + '...',
      latestMessage: savedMessage._id,
      teamId: teamId,
    };

    const discussion = await this.aiDiscussionModel.create(newConvData);
    this.logger.log(`AiDiscussion ${discussion._id} created`);
    return discussion;
  }

  private publishMessageEvent(
    discussionId: string,
    teamSnapshot: TeamSnapshot,
    message: AiMessageSnapshot,
  ): void {
    try {
      const payload: SendAiMessageEventPayload = {
        discussionId,
        teamSnapshot,
        message,
      };

      this.amqp.publish(
        SEARCH_EXCHANGE,
        SEARCH_PATTERN.NEW_MESSAGE_CHATBOT,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish message event for AiDiscussion ${discussionId}: ${error}`
      )
    }
  }

  async createTeam(payload: CreateTeamEventPayload) {
    const { teamSnapshot, createdAt, owner } = payload;
    const { name: title, id: teamId } = teamSnapshot;
    const createAtDate = new Date(createdAt);
    await this.aiDiscussionModel.create({
      teamId,
      userId: owner.id,
      title,
    } as AiDiscussion)

    this.logger.log(`Team ${name} created by ${owner.name} at ${createAtDate.toISOString()}`);
  }

  async findTeamDiscussion(
    userId: string,
    teamId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log(`Find Discussion ${teamId} from ${userId}`);
    const skip = (page - 1) * limit;

    const matchQuery: FilterQuery<AiDiscussion> = { team_id: teamId, "participants._id": userId }
    const results = await this.aiDiscussionModel.aggregate<
      Aggregate<AiDiscussion>
    >([
      { $match: matchQuery },
      {
        $project: {
          title: 1,
          createdAt: 1,
          participantLength: { $size: '$participants' },
          updatedAt: 1,
          totalMessage: { $size: '$messages' },
          messages: { $slice: ['$messages', - skip - limit, limit] },
        },
      },
    ]);

    if (!results || results.length === 0) {
      throw new NotFoundException('Discussion not found');
    }

    const Discussion = results[0] as any;

    return {
      data: Discussion,
      page,
      limit,
      totalPages: Math.ceil(Discussion.totalMessage / limit),
    };
  }


  async findAllDiscussion(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log('');
    const skip = (page - 1) * limit;

    const query: FilterQuery<AiDiscussion> = {
      "participants._id": userId,
      team_id: { $exists: false }
    };

    const dataQuery = this.aiDiscussionModel
      .find(query)
      .select('title _id')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const totalQuery = this.aiDiscussionModel
      .countDocuments(query)
      .exec();
    const [total, data] = await Promise.all([totalQuery, dataQuery]);
    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDiscussion(
    userId: string,
    discussionId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log(`Find Discussion ${discussionId} from ${userId}`);
    const skip = (page - 1) * limit;
    const _id = new mongoose.Types.ObjectId(discussionId);

    const matchQuery: FilterQuery<AiDiscussion> = { _id, "participants._id": userId }

    const results = await this.aiDiscussionModel.aggregate<
      Aggregate<AiDiscussion>
    >([
      { $match: matchQuery },
      {
        $project: {
          title: 1,
          createdAt: 1,
          participantLength: { $size: '$participants' },
          updatedAt: 1,
          totalMessage: { $size: '$messages' },
          messages: { $slice: ['$messages', - skip - limit, limit] },
        },
      },
    ]);

    if (!results || results.length === 0) {
      throw new NotFoundException('Discussion not found');
    }

    const Discussion = results[0] as any;
    Discussion.messages.reverse();


    return {
      data: Discussion,
      page,
      limit,
      totalPages: Math.ceil(Discussion.totalMessage / limit),
    };
  }

  async deleteDiscussion(discussionId: string, userId: string, teamId?: string) {
    try {
      const query: FilterQuery<AiDiscussion> = {
        _id: discussionId,
        "participants._id": userId
      }
      if (teamId) query.team_id = teamId;
      return await this.aiDiscussionModel.findOneAndDelete(query)
    } catch (error) {
      throw new BadRequestException("Discussion not found or unauthorized");
    }
  }

  async userUpdate(user: Partial<User>) {
    return await this.aiDiscussionModel.updateMany(
      {
        "participants._id": user.id
      },
      {
        $set: {
          "participants.$[elem].name": user.name,
          "participants.$[elem].avatar": user.avatar,
        }
      },
      {
        arrayFilters: [{ 'elem._id': user.id }]
      }
    )
  }

  async addMember(payload: AddMemberEventPayload) {
    const { teamId, members } = payload;

    const newParticipants = members.map((m) => ({
      _id: m.id,
      name: m.name,
      avatar: m.avatar,
    }));

    return await this.aiDiscussionModel.updateMany(
      { team_id: teamId },
      { $addToSet: { participants: { $each: newParticipants } } }
    );
  }


  async leaveTeam(payload: LeaveMember) {
    const { teamId, memberIds } = payload;

    return await this.aiDiscussionModel.updateMany(
      { team_id: teamId },
      { $pull: { participants: { _id: { $in: memberIds } } } }
    );
  }

  async removeTeam(payload: RemoveTeamEventPayload) {
    const { teamId } = payload;

    this.logger.warn(`DELETING all RAG Discussions for team ${teamId}`);

    await Promise.all([
      this.aiDiscussionModel.deleteMany(
        { team_id: teamId }
      ),
      // this.storageService.deleteFilesByTeamId(teamId)
    ])

    this.amqp.publish(
      CHATBOT_EXCHANGE,
      CHATBOT_PATTERN.REMOVE_COLLECTION,
      { teamId }
    )
  }
}
