import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Aggregate, FilterQuery, Model } from 'mongoose';
import {
  AddMemberEventPayload,
  BadRequestException,
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  Conversation,
  ConversationDocument,
  CreateTeamEventPayload,
  ForbiddenException,
  LeaveMember,
  Message,
  NotFoundException,
  RemoveMemberEventPayload,
  RemoveTeamEventPayload,
  Team,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  User,
  USER_EXCHANGE,
  USER_PATTERNS,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { StorageService } from './storage.service';
import { Participant } from '../../../libs/contracts/src/chatbot/schema/pariticipant.schema';
import { randomUUID } from 'crypto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    private readonly amqp: AmqpConnection,
    private readonly storageService: StorageService
  ) { }

  async handleMessage(
    userId: string,
    message: string,
    role: 'user' | 'ai' = 'user',
    conversationId?: string,
    teamId?: string,
  ): Promise<Conversation | null> {

    let conversation: ConversationDocument | null;
    let senderParticipant: Participant | null;
    let messageDoc: Message | null;
    if (conversationId) {
      const query: FilterQuery<ConversationDocument> = {
        _id: conversationId,
        "participants._id": userId,
      };
      if (teamId) query.team_id = teamId;

      const existingConvo = await this.conversationModel.findOne(query, {
        participants: { $elemMatch: { _id: userId } }
      });

      if (!existingConvo) {
        this.logger.warn(
          `Failed to find conversation ${conversationId} for user ${userId} or team ${teamId}`,
        );
        throw new NotFoundException(
          'Conversation not found or you do not have permission.',
        );
      }

      if (!existingConvo.participants || existingConvo.participants.length === 0) {
        this.logger.error(`FATAL: Participant ${userId} not found in ${conversationId} despite query match.`);
        throw new ForbiddenException('Participant data corrupted.');
      }
      senderParticipant = existingConvo.participants[0];

      if (role === 'ai') {
        senderParticipant = {
          _id: 'ai-system-id',
          name: 'AI Assistant',
          avatar: '',
          role: 'ai',
        };
      }

      messageDoc = {
        sender: senderParticipant,
        role,
        content: message,
        timestamp: new Date(),
      } as Message;

      conversation = await this.conversationModel.findByIdAndUpdate(
        conversationId,
        { $push: { messages: messageDoc } },
        { new: true },
      );

      this.logger.log(
        `Message added to existing conversation ${conversation?._id}`,
      );

    } else {
      const newConvData: Partial<Conversation> = {
        title: message.substring(0, 30) + '...',
      };

      if (teamId) {
        const team = await this.amqp.request<Team>({
          exchange: TEAM_EXCHANGE,
          routingKey: TEAM_PATTERN.FIND_BY_ID,
          payload: { id: teamId, userId },
        });

        if (!team) {
          this.logger.warn(`Failed to find team ${teamId}`);
          throw new NotFoundException('Team not found.');
        }

        newConvData.team_id = teamId;
        newConvData.participants = team.members.map((member) => ({
          _id: member.id,
          name: member.name,
          avatar: member.avatar,
          role: member.role || "user",
        }));

        senderParticipant = newConvData.participants.find(p => p._id === userId) ?? null;
        if (!senderParticipant) {
          throw new ForbiddenException('User is not a member of this team.');
        }

      } else {
        const user = await this.amqp.request<User>({
          exchange: USER_EXCHANGE,
          routingKey: USER_PATTERNS.FIND_ONE,
          payload: userId,
        });
        if (!user) {
          this.logger.warn(`Failed to find user ${userId}`);
          throw new NotFoundException('User not found.');
        }

        senderParticipant = {
          _id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: 'user',
        };
        newConvData.participants = [senderParticipant];
      }

      if (role === 'ai') {
        senderParticipant = {
          _id: 'ai-system-id',
          name: 'AI Assistant',
          avatar: '',
          role: 'ai',
        };
      }

      messageDoc = {
        sender: senderParticipant,
        role,
        content: message,
        timestamp: new Date(),
      } as Message;

      newConvData.messages = [messageDoc];

      conversation = await this.conversationModel.create(newConvData);
      this.logger.log(`Conversation ${conversation._id} created`);
    }

    return conversation;
  }

  async createTeam(payload: CreateTeamEventPayload) {
    const { teamId, members, createdAt, ownerName, ownerId, name } = payload;

    const createAtDate = new Date(createdAt);
    await this.conversationModel.create({
      team_id: teamId,
      participants: members.map((m) => ({
        _id: m.id,
        name: m.name,
        avatar: m.avatar,
        role: m.role || "user"
      })),
      title: name,
      createdAt: createAtDate,
    })

    this.logger.log(`Team ${name} created by ${ownerName} at ${createAtDate.toISOString()}`);
  }

  async findTeamConversation(
    userId: string,
    teamId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log(`Find conversation ${teamId} from ${userId}`);
    const skip = (page - 1) * limit;

    const matchQuery: FilterQuery<ConversationDocument> = { team_id: teamId, "participants._id": userId }
    const results = await this.conversationModel.aggregate<
      Aggregate<ConversationDocument>
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
      throw new NotFoundException('Conversation not found');
    }

    const conversation = results[0] as any;

    return {
      data: conversation,
      page,
      limit,
      totalPages: Math.ceil(conversation.totalMessage / limit),
    };
  }

  async findAllConversation(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log('');
    const skip = (page - 1) * limit;

    const query: FilterQuery<ConversationDocument> = {
      "participants._id": userId,
      team_id: { $exists: false }
    };

    const dataQuery = this.conversationModel
      .find(query)
      .select('title _id')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    const totalQuery = this.conversationModel
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

  async findConversation(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 15,
  ) {
    this.logger.log(`Find conversation ${conversationId} from ${userId}`);
    const skip = (page - 1) * limit;
    const _id = new mongoose.Types.ObjectId(conversationId);

    const matchQuery: FilterQuery<ConversationDocument> = { _id, "participants._id": userId }

    const results = await this.conversationModel.aggregate<
      Aggregate<ConversationDocument>
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
      throw new NotFoundException('Conversation not found');
    }

    const conversation = results[0] as any;
    conversation.messages.reverse();


    return {
      data: conversation,
      page,
      limit,
      totalPages: Math.ceil(conversation.totalMessage / limit),
    };
  }

  async deleteConversation(conversationId: string, userId: string, teamId?: string) {
    try {
      const query: FilterQuery<ConversationDocument> = {
        _id: conversationId,
        "participants._id": userId
      }
      if (teamId) query.team_id = teamId;
      return await this.conversationModel.findOneAndDelete(query)
    } catch (error) {
      throw new BadRequestException("Conversation not found or unauthorized");
    }
  }

  async userUpdate(user: Partial<User>) {
    return await this.conversationModel.updateMany(
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
      role: m.role || "user"
    }));

    return await this.conversationModel.updateMany(
      { team_id: teamId },
      { $addToSet: { participants: { $each: newParticipants } } }
    );
  }

  async removeMember(payload: RemoveMemberEventPayload) {
    const { teamId, memberIds } = payload;

    return await this.conversationModel.updateMany(
      { team_id: teamId },
      { $pull: { participants: { _id: { $in: memberIds } } } }
    );
  }
  async leaveTeam(payload: LeaveMember) {
    const { teamId, memberIds } = payload;

    return await this.conversationModel.updateMany(
      { team_id: teamId },
      { $pull: { participants: { _id: { $in: memberIds } } } }
    );
  }

  async removeTeam(payload: RemoveTeamEventPayload) {
    const { teamId } = payload;

    this.logger.warn(`DELETING all RAG conversations for team ${teamId}`);

    await Promise.all([
      this.conversationModel.deleteMany(
        { team_id: teamId }
      ),
      this.storageService.deleteFilesByTeamId(teamId)
    ])

    this.amqp.publish(
      CHATBOT_EXCHANGE,
      CHATBOT_PATTERN.REMOVE_COLLECTION,
      { teamId }
    )
  }
}
