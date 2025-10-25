import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation } from './schema/conversation.schema';
import { Message } from './schema/message.schema';
import {
  ChangeRoleMember,
  CreateChatMessageDto,
  User,
  LeaveMember,
  MEMBER_ROLE,
  CreateTeamEventPayload,
  AddMemberEventPayload,
  RemoveMemberEventPayload,
  TransferOwnershipEventPayload,
  CreateDirectChatDto,
  USER_PATTERNS,
  USER_CLIENT,
  EVENT_CLIENT,
  EVENTS,
  SendMessageEventPayload,
  SOCKET_CLIENT,
  ConversationDocument,
  USER_EXCHANGE,
  EVENTS_EXCHANGE,
  CHAT_EXCHANGE,
  CHAT_PATTERN,
  RPC_TIMEOUT,
  PaginationDto,
  SEARCH_EXCHANGE,
  SEARCH_PATTERN,
} from '@app/contracts';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    private readonly amqp: AmqpConnection
  ) { }

  async createChat(createTeam: CreateTeamEventPayload): Promise<Conversation> {
    const { ownerId, members, name, teamId } = createTeam;
    this.logger.log(`Creating a new team named "${name}"...`);

    const participants = members.map((member) => ({
      _id: member.id,
      name: member.name,
      avatar: member.avatar,
      role: member.role,
    }));

    const newConversation = new this.conversationModel({
      ownerId,
      teamId,
      participants,
      name,
      isGroupChat: true,
      groupAdmins: [ownerId],
    });
    this.logger.log(`Team "${name}" created successfully.`);
    return await newConversation.save();
  }

  async createDirectChat(payload: CreateDirectChatDto): Promise<Conversation> {
    const { partnerId, senderId } = payload;

    if (partnerId === senderId) {
      throw new BadRequestException(
        'You cannot create a direct chat with yourself.',
      );
    }

    const participantIds = [partnerId, senderId];

    const existingConversation = await this.conversationModel
      .findOne({
        isGroupChat: false,
        'participants._id': { $all: participantIds },
        participants: { $size: 2 },
      })
      .lean();

    if (existingConversation) {
      return existingConversation;
    }

    this.logger.log(`Fetching user data for IDs: ${participantIds.join(', ')}`);
    const usersFromDb = await this.amqp.request<Partial<User>[]>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
      payload: participantIds,
    })

    if (usersFromDb.length !== 2) {
      const foundIds = new Set(usersFromDb.map((u) => u.id));
      const missingId = participantIds.find((id) => !foundIds.has(id));
      throw new NotFoundException(`User with ID "${missingId}" not found.`);
    }

    const participants = usersFromDb.map((user) => ({
      _id: user.id,
      name: user.name,
      avatar: user.avatar,
    }));

    return this.conversationModel.create({
      participants,
      isGroupChat: false,
      groupAdmins: [],
    });
  }

  async addMember(payload: AddMemberEventPayload): Promise<Conversation> {
    const {
      members,
      requesterId,
      teamId: conversationId,
      requesterName,
    } = payload;
    this.logger.log(
      `User [${requesterId}] adding ${members.length} members to conversation [${conversationId}].`,
    );

    await this._verifyPermission(conversationId, requesterId, [
      MEMBER_ROLE.ADMIN,
      MEMBER_ROLE.OWNER,
    ]);

    const content = `${requesterName} added ${members.map((m) => m.name).join(', ')} to the group.`;

    const [updatedConversation, _] = await Promise.all([
      this.conversationModel
        .findByIdAndUpdate(
          conversationId,
          { $addToSet: { participants: { $each: members } } },
          { new: true },
        )
        .lean<Conversation>(),

      this._systemSendMessage(conversationId, content),
    ]);

    void _;

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return updatedConversation;
  }

  async removeMember(payload: RemoveMemberEventPayload): Promise<Conversation> {
    const { memberIds, requesterId, teamId: conversationId } = payload;
    this.logger.log(
      `User [${requesterId}] removing members from conversation [${conversationId}].`,
    );

    const conversation = await this._verifyPermission(
      conversationId,
      requesterId,
      [MEMBER_ROLE.ADMIN, MEMBER_ROLE.OWNER],
    );
    const requester = conversation.participants.find(
      (p) => p._id === requesterId,
    );

    if (!requester) {
      throw new NotFoundException('You are not in this team.');
    }

    if (!conversation.isGroupChat) {
      throw new BadRequestException(
        'You cannot remove members from a direct chat.',
      );
    }

    const membersToRemove = conversation.participants.filter((p) =>
      memberIds.includes(p._id),
    );

    if (membersToRemove.length === 0) {
      throw new NotFoundException(
        'None of the provided member IDs were found in the team.',
      );
    }

    for (const member of membersToRemove) {
      if (member._id === conversation.ownerId) {
        throw new ForbiddenException('The team owner cannot be removed.');
      }
      if (
        requester.role === MEMBER_ROLE.ADMIN &&
        member.role === MEMBER_ROLE.ADMIN
      ) {
        throw new ForbiddenException(
          `An admin cannot remove another admin (user: ${member._id}).`,
        );
      }
    }

    const validMemberIdsToRemove = membersToRemove.map((m) => m._id);

    const [updatedConversation] = await Promise.all([
      this.conversationModel
        .findByIdAndUpdate(
          conversationId,
          { $pull: { participants: { _id: { $in: validMemberIdsToRemove } } } },
          { new: true },
        )
        .lean<Conversation>(),

      this._systemSendMessage(
        conversationId,
        `${requester.name} removed ${membersToRemove.map((m) => m.name).join(', ')} from the group.`,
      ),
    ]);

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return updatedConversation;
  }

  async leaveTeam(payload: LeaveMember): Promise<Conversation> {
    const { teamId: conversationId, requesterId, requesterName } = payload;
    this.logger.log(`User [${requesterId}] leaving team [${conversationId}].`);

    const conversation = await this._verifyPermission(
      conversationId,
      requesterId,
      [MEMBER_ROLE.MEMBER, MEMBER_ROLE.ADMIN, MEMBER_ROLE.OWNER],
    );

    if (conversation.ownerId === requesterId) {
      throw new ForbiddenException(
        'As the team owner, you cannot leave. Please delete the team or transfer ownership first.',
      );
    }

    const [updatedConversation] = await Promise.all([
      this.conversationModel
        .findByIdAndUpdate(
          conversationId,
          { $pull: { participants: { _id: requesterId } } },
          { new: true },
        )
        .lean<Conversation>(),

      this._systemSendMessage(
        conversationId,
        `${requesterName} has left the group.`,
      ),
    ]);

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return updatedConversation;
  }

  async changeRole(payload: ChangeRoleMember): Promise<Conversation> {
    const {
      requesterId,
      teamId: conversationId,
      targetId,
      newRole,
      requesterName,
      targetName,
    } = payload;
    this.logger.log(
      `User [${requesterId}] changing role of [${targetId}] to ${newRole}.`,
    );

    await this._verifyPermission(conversationId, requesterId, [
      MEMBER_ROLE.ADMIN,
      MEMBER_ROLE.OWNER,
    ]);

    const [updatedConversation] = await Promise.all([
      this.conversationModel
        .findOneAndUpdate(
          { _id: conversationId, 'participants._id': targetId },
          { $set: { 'participants.$.role': newRole } },
          { new: true },
        )
        .lean<Conversation>(),

      this._systemSendMessage(
        conversationId,
        `${requesterName} changed ${targetName}'s role to ${newRole}.`,
      ),
    ]);

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return updatedConversation;
  }

  async transferOwnership(
    payload: TransferOwnershipEventPayload,
  ): Promise<Conversation> {
    const {
      teamId: conversationId,
      requesterId,
      newOwnerId,
      newOwnerName,
      requesterName,
    } = payload;
    this.logger.log(
      `Transferring ownership of [${conversationId}] from [${requesterId}] to [${newOwnerId}].`,
    );

    if (requesterId === newOwnerId) {
      throw new BadRequestException('You are already the owner of this team.');
    }

    const conversation = await this._verifyPermission(
      conversationId,
      requesterId,
      [MEMBER_ROLE.OWNER],
    );
    if (conversation.ownerId !== requesterId) {
      throw new ForbiddenException(
        'Only the current team owner can transfer ownership.',
      );
    }

    const [updatedConversation] = await Promise.all([
      this.conversationModel
        .findByIdAndUpdate(
          conversationId,
          {
            $set: {
              ownerId: newOwnerId,
              'participants.$[oldOwner].role': MEMBER_ROLE.ADMIN,
              'participants.$[newOwner].role': MEMBER_ROLE.OWNER,
            },
          },
          {
            arrayFilters: [
              { 'oldOwner._id': requesterId },
              { 'newOwner._id': newOwnerId },
            ],
            new: true,
          },
        )
        .lean<Conversation>(),

      this._systemSendMessage(
        conversationId,
        `${requesterName} transferred ownership to ${newOwnerName}.`,
      ),
    ]);

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return updatedConversation;
  }

  async createChatMessage(
    createChatMessage: CreateChatMessageDto,
  ): Promise<Message> {
    const { conversationId, senderId, content, attachments } =
      createChatMessage;

    this._markAsRead(conversationId, senderId);

    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      'participants._id': senderId,
    });
    if (!conversation) {
      throw new ForbiddenException(
        `Conversation not found or you are not a participant.`,
      );
    }
    const sender = conversation.participants.find(
      (p) => p._id.toString() === senderId,
    );
    console.log(sender)
    if (!sender) {
      throw new ForbiddenException(
        `Conversation not found or you are not a participant.`,
      );
    }
    const newMessage = new this.messageModel({
      conversation: conversationId,
      sender,
      content,
      attachments,
    });
    const savedMessage = await newMessage.save();
    conversation.latestMessage = savedMessage;
    await conversation.save();
    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.NEW_MESSAGE, {
      id: savedMessage._id.toString(),
      conversationId,
      attachments,
      sender,
      content,
      participants: conversation.participants,
      reactions: [],
      createdAt: savedMessage.createdAt,
    } as SendMessageEventPayload);
    return savedMessage;
  }

  async getConversationsForUser(userId: string, page = 1, limit = 20) {
    const [conversations, total] = await Promise.all([
      this.conversationModel
        .find({ 'participants._id': userId })
        .skip((page - 1) * limit)
        .populate('latestMessage')
        .limit(limit)
        .sort({ updatedAt: -1 })
        .lean<ConversationDocument>(),
      this.conversationModel.countDocuments({ 'participants._id': userId }),
    ]);

    return {
      data: conversations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMessagesForConversation(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 20,
  ): Promise<Message[]> {
    const conversation = await this.conversationModel
      .findOne(
        {
          _id: conversationId,
          'participants._id': userId,
        },
        { _id: 1 },
      )
      .lean();
    if (!conversation) {
      throw new ForbiddenException(
        'You are not authorized to access this conversation.',
      );
    }

    this._markAsRead(conversationId, userId);

    return await this.messageModel
      .find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async getConversationById(conversationId: string, userId: string) {
    return await this.conversationModel
      .findOne({ _id: conversationId, 'participants._id': userId })
      .lean<ConversationDocument>();
  }

  async updateUser(user: Partial<User>) {
    const { id, name, avatar } = user;
    if (!id) return;
    try {
      await this.conversationModel.updateMany(
        { 'participants._id': id },
        {
          $set: {
            'participants.$[elem].name': name,
            'participants.$[elem].avatar': avatar,
          },
        },
        {
          arrayFilters: [{ 'elem._id': id }],
        },
      );
      await this.messageModel.updateMany(
        { 'sender._id': id },
        {
          $set: {
            'sender.name': name,
            'sender.avatar': avatar,
          },
        },
      );
    } catch (error) {
      this.logger.error(`Failed to update user info for ${id}`, error);
    }
  }

  private async _verifyPermission(
    conversationId: string,
    requesterId: string,
    allowedRoles: MEMBER_ROLE[],
  ) {
    const conversation = await this.conversationModel
      .findOne({
        _id: conversationId,
        participants: {
          $elemMatch: {
            _id: requesterId,
            role: { $in: allowedRoles },
          },
        },
      })
      .lean<Conversation>();
    if (!conversation) {
      throw new ForbiddenException(
        'You do not have permission to perform this action on this conversation.',
      );
    }
    return conversation;
  }

  private async _systemSendMessage(
    conversationId: string | Types.ObjectId,
    content: string,
  ) {
    const systemMessage = new this.messageModel({
      conversation: conversationId,
      sender: {
        _id: 'SYSTEM',
        name: 'System',
        avatar: '',
        role: MEMBER_ROLE.MEMBER,
      },
      content,
    });
    const savedMessage = await systemMessage.save();

    await this.conversationModel.findByIdAndUpdate(conversationId, {
      latestMessage: savedMessage._id,
    });
    return savedMessage;
  }

  private async _markAsRead(conversationId: string, id: string) {
    try {
      const reader = {
        id,
        readAt: new Date(),
      };

      await this.messageModel
        .updateMany(
          {
            conversation: conversationId,
            readBy: { $not: { $elemMatch: { id } } },
          },
          { $addToSet: { readBy: reader } },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Failed to mark messages as read for conversation ${conversationId}`,
        error,
      );
    }
  }

  async getAllMessages() {
    return await this.messageModel.find().exec();
  }

  async searchMessages(query: string, conversationId: string, userId: string, options: PaginationDto) {
    console.log(query, conversationId, userId, options);
    const isParticipant = await this.conversationModel.findOne({
      _id: conversationId,
      'participants._id': userId,
    })

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not authorized to access this conversation.',
      );
    }

    return await this.amqp.request<Message[]>({
      exchange: SEARCH_EXCHANGE,
      routingKey: SEARCH_PATTERN.SEARCH_MESSAGE,
      payload: { query, conversationId, options },
      timeout: RPC_TIMEOUT
    })
  }

}
