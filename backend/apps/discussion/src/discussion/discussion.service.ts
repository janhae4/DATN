import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, QueryOptions, Types, UpdateQuery } from 'mongoose';
import { Attachment, Message, SenderSnapshot } from './schema/message.schema';
import {
  ChangeRoleMember,
  User,
  MemberRole,
  CreateTeamEventPayload,
  AddMemberEventPayload,
  RemoveMemberEventPayload,
  TransferOwnershipEventPayload,
  USER_PATTERNS,
  EVENTS,
  SendMessageEventPayload,
  USER_EXCHANGE,
  EVENTS_EXCHANGE,
  RPC_TIMEOUT,
  SEARCH_EXCHANGE,
  SEARCH_PATTERN,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  MemberShip,
  LeaveMemberEventPayload,
  RemoveTeamEventPayload,
  SENDER_SNAPSHOT_SYSTEM,
  CreateDirectDiscussionDto,
  CreateMessageDto,
  TeamSnapshot,
  ResponseMessageDto,
  MessageSnapshot,
  ResponsePaginationDto,
  RequestPaginationDto,
  SearchMessageDto,
  REDIS_EXCHANGE,
  REDIS_PATTERN,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Discussion, DiscussionDocument, LatestMessageSnapshot, ParticipantRef } from './schema/discussion.schema';

@Injectable()
export class DiscussionService {
  private readonly logger = new Logger(DiscussionService.name);

  constructor(
    @InjectModel(Discussion.name)
    private readonly discussionModel: Model<DiscussionDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    private readonly amqp: AmqpConnection
  ) { }

  async createChat(createTeam: CreateTeamEventPayload) {
    console.log('Received createChat event:', createTeam);
    const { owner, members, teamSnapshot } = createTeam;
    const { id: teamId, name } = teamSnapshot;

    this.logger.log(`Creating a new team named "${name}"...`);

    const ownerParticipant: ParticipantRef = {
      _id: owner.id,
      status: MemberShip.ACTIVE,
    };
    const memberParticipants: ParticipantRef[] = members.map(member => ({
      _id: member.id,
      status: MemberShip.ACTIVE,
      role: MemberRole.MEMBER,
    }));

    const allParticipants = [ownerParticipant, ...memberParticipants];

    const savedDiscussion = await this.discussionModel.create({
      teamId,
      name,
      isGroup: true,
      ownerId: owner.id,
      groupAdminIds: [ownerParticipant],
      teamSnapshot,
      participants: allParticipants,
    });
    this.logger.log(`Team "${name}" with ID "${teamId}" created successfully.`);

    await this._systemSendMessage(
      savedDiscussion,
      `${owner.name} created the team "${name}".`
    );
  }

  async createDirectChat(payload: CreateDirectDiscussionDto): Promise<Discussion> {
    const { partnerId, senderId } = payload;
    if (partnerId === senderId) throw new BadRequestException("Cannot create chat with yourself.");

    const participantIds = [partnerId, senderId];

    const discussion = await this.discussionModel.findOne({
      isGroup: false,
      'participants._id': { $all: participantIds, $size: 2 },
    }).lean<Discussion>();

    if (discussion) return discussion;

    const users = await this.amqp.request<Partial<User>[]>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
      payload: participantIds,
    });

    if (users.length !== 2) throw new NotFoundException('User not found');

    const participants: ParticipantRef[] = users.map(user => ({
      _id: user.id as string,
      status: MemberShip.ACTIVE,
      role: MemberRole.MEMBER,
    }));

    return this.discussionModel.create({
      participants,
      isGroup: false,
      groupAdmins: [],
    });
  }

  async createChatMessage(
    createChatMessage: CreateMessageDto,
  ): Promise<ResponseMessageDto> {
    const { discussionId, userId, content, attachments } =
      createChatMessage;

    await this._markAsRead(discussionId, userId);

    const discussion = await this._getDiscussionOrFail(discussionId, userId);

    const sender = await this.amqp.request<SenderSnapshot>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
      payload: { userIds: [userId], forDiscussion: true },
    })

    if (!sender) throw new NotFoundException('User not found');

    return await this._createMessage(
      discussion,
      sender,
      content as string,
      attachments as Attachment[],
    );
  }

  async addMember(payload: AddMemberEventPayload) {
    const { members, requesterId, teamId, requesterName, teamName } = payload;
    this.logger.log(
      `User [${requesterId}] adding ${members.length} members to team [${teamId}].`,
    );

    const membersToAdd: ParticipantRef[] = members.map(member => ({
      _id: member.id,
      status: MemberShip.ACTIVE,
    }));

    const discussion = await this.discussionModel.findOneAndUpdate(
      { teamId, 'groupAdminIds._id': requesterId },
      { $addToSet: { participants: { $each: membersToAdd } } },
      { new: true }
    );

    if (!discussion) {
      throw new NotFoundException('Discussion not found or requester is not an admin.');
    }

    const message = `${requesterName} added ${members.length < 4
      ? members.map(m => m.name).join(", ")
      : `${members.slice(0, 2).map(m => m.name).join(", ")}, and ${members.length - 2} others` // Trường hợp 2: Nhiều, rút gọn
      }.`

    await this._systemSendMessage(
      discussion,
      message
    )
  }


  async changeRole(payload: ChangeRoleMember) {
    const {
      requesterId,
      teamId,
      targetId,
      newRole,
      requesterName,
      targetName,
    } = payload;

    this.logger.log(
      `User [${requesterId}] changing role of [${targetId}] to ${newRole}.`,
    );

    const updateQuery: UpdateQuery<DiscussionDocument> = {};

    if ([MemberRole.ADMIN, MemberRole.OWNER].includes(newRole)) {
      updateQuery.$addToSet = { groupAdminIds: { _id: targetId, status: MemberShip.ACTIVE } };
    } else {
      updateQuery.$pull = { groupAdminIds: { _id: targetId } };
    }

    const updatedDiscussion = await this.discussionModel.findOneAndUpdate(
      { teamId, 'groupAdminIds._id': requesterId },
      updateQuery,
      { new: true }
    );

    if (updatedDiscussion) {
      await this._systemSendMessage(
        updatedDiscussion,
        `${requesterName} changed ${targetName}'s role to ${newRole}.`,
      );
    }
  }

  async transferOwnership(
    payload: TransferOwnershipEventPayload,
  ): Promise<Discussion> {
    const {
      teamId,
      requesterId,
      newOwnerId,
      newOwnerName,
      requesterName,
    } = payload;

    this.logger.log(
      `Transferring ownership of [${teamId}] from [${requesterId}] to [${newOwnerId}].`,
    );

    const updatedDiscussion = await this.discussionModel
      .findOneAndUpdate(
        { teamId, ownerId: requesterId },
        {
          $set: {
            ownerId: newOwnerId,
            'participants.$[oldOwner].role': MemberRole.ADMIN,
            'participants.$[newOwner].role': MemberRole.OWNER,
          },
          $addToSet: {
            groupAdminIds: { _id: newOwnerId, status: MemberShip.ACTIVE },
          }
        },
        {
          arrayFilters: [
            { 'oldOwner._id': requesterId },
            { 'newOwner._id': newOwnerId },
          ],
          new: true,
        },
      )
      .lean<DiscussionDocument>();

    if (!updatedDiscussion) {
      throw new ForbiddenException(
        'Discussion not found or you are not the owner.',
      );
    }

    await this._systemSendMessage(
      updatedDiscussion,
      `${requesterName} transferred ownership to ${newOwnerName}.`,
    );

    return updatedDiscussion;
  }

  async removeMember(payload: RemoveMemberEventPayload) {
    const { members, teamId, requesterId, requesterName } = payload;

    const memberIds = members.map(member => member.id);

    const operation: UpdateQuery<DiscussionDocument> = {
      $pull: {
        groupAdminIds: { _id: { $in: memberIds } }
      },
      $set: {
        'participants.$[elem].status': MemberShip.LEFT
      }
    };

    const option: QueryOptions<DiscussionDocument> = {
      new: true,
      arrayFilters: [{ 'elem._id': { $in: memberIds } }]
    };

    const updatedDiscussion = await this.discussionModel.findOneAndUpdate(
      { teamId, 'groupAdminIds._id': requesterId },
      operation,
      option
    );

    if (!updatedDiscussion) {
      throw new NotFoundException('Discussion not found or requester is not an admin.');
    }

    const removedNames = members.map(m => m.name).join(', ');
    await this._systemSendMessage(
      updatedDiscussion,
      `${requesterName} removed ${removedNames} from the group.`
    );

    return updatedDiscussion;
  }

  async leaveTeam(payload: LeaveMemberEventPayload): Promise<void> {
    const { teamId, teamName, requester } = payload;
    this.logger.log(`User [${requester.id}] leaving team [${teamId}].`);

    const discussion = await this.discussionModel.findOne({ teamId });
    if (!discussion) throw new NotFoundException('Discussion not found.');

    if (discussion.ownerId === requester.id) {
      throw new ForbiddenException('Owner cannot leave the team. Please transfer ownership first.');
    }

    const updatedDiscussion = await this.discussionModel.findOneAndUpdate(
      { _id: discussion._id },
      { $set: { 'participants.$[elem].status': MemberShip.LEFT } },
      {
        arrayFilters: [{ 'elem._id': requester.id }],
        new: true
      }
    );

    if (updatedDiscussion) {
      await this._systemSendMessage(
        updatedDiscussion,
        `${requester.name} left ${teamName}.`,
      );
    }
  }

  async removeTeam(payload: RemoveTeamEventPayload) {
    const { teamId, requesterName, teamName, requesterId } = payload;
    this.logger.log(`User [${requesterName}] deleting team [${teamId}].`);

    const discussion = await this.discussionModel.findOneAndUpdate(
      { teamId, participants: { $elemMatch: { _id: requesterId } } },
      { $set: { isDeleted: true } },
    )

    if (!discussion) throw new NotFoundException('Discussion not found.');

    await this._systemSendMessage(
      discussion,
      `${teamName} has been deleted by ${requesterName}.`,
    );
  }

  async getDiscussionsForUser(userId: string, page = 1, limit = 20) {
    this.logger.log(`Getting discussions for user [${userId}]`);
    const [discussions, total] = await Promise.all([
      this.discussionModel
        .find({ 'participants._id': userId, 'participants.status': MemberShip.ACTIVE })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ 'latestMessageSnapshot.createdAt': -1, updatedAt: -1 })
        .lean<Discussion>(),
      this.discussionModel.countDocuments({ 'participants._id': userId, 'participants.status': MemberShip.ACTIVE }),
    ]);

    return {
      data: discussions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDiscussionByTeamId(userId: string, teamId: string) {
    const discussion = await this.discussionModel
      .findOne({ teamId, 'participants._id': userId, isDeleted: { $ne: true } })
      .lean<Discussion>();

    if (!discussion) {
      throw new NotFoundException('Discussion not found.');
    }
    return discussion;
  }


  async getMessagesForDiscussion(
    userId: string,
    discussionId: string,
    page = 1,
    limit = 20,
  ): Promise<ResponsePaginationDto<Message>> {
    console.log(userId, discussionId);

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;

    const discussion = await this.discussionModel
      .findOne(
        {
          _id: discussionId,
          'participants._id': userId,
        },
      )
      .lean();

    if (!discussion) {
      throw new ForbiddenException(
        'You are not authorized to access this discussion.',
      );
    }

    this._markAsRead(discussionId, userId);

    const discussionObjectId = new mongoose.Types.ObjectId(discussionId);

    const [messages, totalItems] = await Promise.all([
      this.messageModel
        .find({ discussionId: discussionObjectId })
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .select('_id content sender attachments createdAt reactions')
        .lean(),

      this.messageModel.countDocuments({ discussionId: discussionObjectId }),
    ]);

    const totalPages = Math.ceil(totalItems / numericLimit);

    return {
      data: messages,
      page: numericPage,
      total: totalItems,
      totalPages,
    };
  }

  async getDiscussionById(discussionId: string, userId: string) {
    return await this.discussionModel
      .findOne({ _id: discussionId, 'participants._id': userId })
      .lean<Discussion>();
  }

  async updateUser(user: Partial<User>) {
    const { id, name, avatar } = user;
    if (!id) return;
    try {
      await Promise.all([
        this.messageModel.updateMany(
          { 'sender._id': id },
          {
            $set: {
              'sender.name': name,
              'sender.avatar': avatar,
            },
          },
        ),

        this.discussionModel.updateMany(
          { 'latestMessageSnapshot.sender._id': id },
          {
            $set: {
              'latestMessageSnapshot.sender.name': name,
              'latestMessageSnapshot.sender.avatar': avatar,
            }
          }
        )
      ]);
    } catch (error) {
      this.logger.error(`Failed to update user info for ${id}`, error);
    }
  }

  async getAllMessages() {
    return await this.messageModel.find().exec();
  }

  async searchMessages(query: string, discussionId: string, userId: string, options: RequestPaginationDto) {
    const isParticipant = await this.discussionModel.findOne({
      _id: discussionId,
      'participants._id': userId,
    });

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not authorized to access this discussion.',
      );
    }

    return await this.amqp.request<Message[]>({
      exchange: SEARCH_EXCHANGE,
      routingKey: SEARCH_PATTERN.SEARCH_MESSAGE,
      payload: { query, discussionId, options, userId } as SearchMessageDto,
      timeout: RPC_TIMEOUT
    });
  }

  private async _getDiscussionOrFail(discussionId: string, userId?: string) {
    const filter: mongoose.FilterQuery<DiscussionDocument> = { _id: discussionId, isDeleted: { $ne: true } };
    if (userId) filter['participants._id'] = userId;

    const discussion = await this.discussionModel.findOne(filter);

    if (!discussion) throw new ForbiddenException('Discussion has been deleted or access denied.');
    return discussion;
  }

  private async _createMessage(
    discussion: DiscussionDocument,
    sender: SenderSnapshot,
    content: string,
    attachments?: Attachment[]
  ) {
    const message = new this.messageModel({
      discussionId: discussion._id,
      content,
      attachments,
      sender,
    });

    const savedMessage = await message.save();

    const messageSnapshot: LatestMessageSnapshot = {
      _id: savedMessage._id.toString(),
      sender,
      content: savedMessage.content,
      attachments: savedMessage.attachments,
      createdAt: savedMessage.createdAt,
    };

    discussion.latestMessage = savedMessage._id;
    discussion.latestMessageSnapshot = messageSnapshot;
    await discussion.save();

    const membersToNotify = discussion.participants
      .filter((participant) => participant._id !== sender._id && participant.status === MemberShip.ACTIVE)
      .map((participant) => participant._id);

    const payload: SendMessageEventPayload = {
      _id: savedMessage._id.toString(),
      discussionId: (discussion._id as Types.ObjectId).toString(),
      messageSnapshot: discussion.latestMessageSnapshot,
      teamSnapshot: discussion.teamSnapshot as TeamSnapshot,
      participantIds: [sender._id, ...membersToNotify],
      membersToNotify
    }

    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.NEW_MESSAGE, payload);

    const response: ResponseMessageDto = {
      _id: savedMessage._id.toString(),
      discussionId: (discussion._id as Types.ObjectId).toString(),
      message: messageSnapshot as MessageSnapshot
    }
    return response;
  }

  private async _markAsRead(discussionId: string, id: string) {
    try {
      const reader = {
        id,
        readAt: new Date(),
      };

      await this.messageModel
        .updateMany(
          {
            discussionId: new mongoose.Types.ObjectId(discussionId),
            'readBy.id': { $ne: id },
          },
          { $addToSet: { readBy: reader } },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to mark messages as read for discussion ${discussionId}`,
        error,
      );
    }
  }

  private async _systemSendMessage(
    discussion: DiscussionDocument,
    content: string,
  ) {
    const systemMessage = new this.messageModel({
      discussionId: discussion._id,
      content,
      sender: SENDER_SNAPSHOT_SYSTEM
    });
    const savedMessage = await systemMessage.save();

    const messageSnapshot: LatestMessageSnapshot = {
      _id: savedMessage._id.toString(),
      sender: SENDER_SNAPSHOT_SYSTEM,
      content: savedMessage.content,
      attachments: savedMessage.attachments,
      createdAt: savedMessage.createdAt,
    };

    discussion.latestMessage = savedMessage._id;
    discussion.latestMessageSnapshot = messageSnapshot;
    await discussion.save();

    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.NEW_MESSAGE, {
      _id: savedMessage._id.toString(),
      discussionId: (discussion._id as Types.ObjectId).toString(),
      teamSnapshot: discussion.teamSnapshot,
      messageSnapshot,
      membersToNotify: discussion.participants.map((participant) => participant._id),
    } as SendMessageEventPayload);

    return savedMessage;
  }

}
