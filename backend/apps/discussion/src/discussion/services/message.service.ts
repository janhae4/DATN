import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
    CreateMessageDto,
    ResponseMessageDto,
    MessageSnapshot,
    ResponsePaginationDto,
    RequestPaginationDto,
    SearchMessageDto,
    SENDER_SNAPSHOT_SYSTEM,
    EVENTS_EXCHANGE,
    EVENTS,
    SendMessageEventPayload,
    USER_EXCHANGE,
    USER_PATTERNS,
    SEARCH_EXCHANGE,
    SEARCH_PATTERN,
    RPC_TIMEOUT,
    TeamSnapshot,
    User,
    MemberShip,
    MemberRole,
} from '@app/contracts';
import { Discussion, DiscussionDocument, LatestMessageSnapshot, Membership, MembershipDocument, ReadReceipt, ReadReceiptDocument } from '../schema/discussion.schema';
import { Attachment, Message, ReplySnapshot, SenderSnapshot } from '../schema/message.schema';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectModel(Discussion.name)
        private readonly discussionModel: Model<DiscussionDocument>,
        @InjectModel(Message.name)
        private readonly messageModel: Model<Message>,
        @InjectModel(Membership.name)
        private readonly membershipModel: Model<MembershipDocument>,
        @InjectModel(ReadReceipt.name)
        private readonly readReceiptModel: Model<ReadReceiptDocument>,
        private readonly amqp: AmqpConnection
    ) { }

    /**
     * Handles the creation of a new chat message initiated by a user.
     * 1. Marks existing messages as read for the user.
     * 2. Verifies the user's participation in the discussion.
     * 3. Fetches the sender's snapshot information.
     * 4. Persists the message and notifies participants.
     * 
     * @param createChatMessage DTO containing discussionId, userId, content, and attachments.
     * @returns A promise that resolves to the created message details (ResponseMessageDto).
     */
    async createChatMessage(
        createChatMessage: CreateMessageDto,
    ): Promise<ResponseMessageDto> {
        const { discussionId, userId, content, attachments, replyToId } =
            createChatMessage;

        await this.markAsRead(discussionId, userId);

        const discussion = await this.getDiscussionOrFail(discussionId, userId);

        const senders = await this.amqp.request<SenderSnapshot[]>({
            exchange: USER_EXCHANGE,
            routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
            payload: { userIds: [userId], forDiscussion: true },
        });

        const sender = senders && senders.length > 0 ? senders[0] : null;

        if (!sender) throw new NotFoundException('User not found');

        let replyToSnapshot: ReplySnapshot | null = null;
        if (replyToId) {
            const parentMessage = await this.messageModel.findById(replyToId).lean();
            if (parentMessage) {
                replyToSnapshot = {
                    messageId: parentMessage._id.toString(),
                    content: parentMessage.content,
                    senderName: parentMessage.sender.name
                };
            }
        }

        return await this.createMessage(
            discussion,
            sender,
            content as string,
            attachments as Attachment[],
            replyToSnapshot,
        );
    }

    /**
     * Retrieves a paginated list of messages for a specific discussion.
     * Also marks the discussion as read for the requesting user.
     * 
     * @param userId The ID of the user requesting messages.
     * @param discussionId The ID of the discussion.
     * @param page The page number for pagination (defaults to 1).
     * @param limit The number of items per page (defaults to 20).
     * @returns A paginated response containing messages and metadata.
     * @throws ForbiddenException if the user is not a participant in the discussion.
     */
    async getMessagesForDiscussion(
        userId: string,
        discussionId: string,
        page = 1,
        limit = 20,
    ): Promise<ResponsePaginationDto<Message>> {
        const numericPage = Number(page) || 1;
        const numericLimit = Number(limit) || 20;

        const discussion = await this.discussionModel.findById(discussionId).lean();

        if (!discussion) throw new NotFoundException('Discussion not found');
        const membership = await this.membershipModel.findOne({ discussionId, userId }).lean();
        if (!membership) {
            throw new ForbiddenException('You are not authorized to access this discussion.');
        }

        await this.markAsRead(discussionId, userId);

        const [messages, totalItems] = await Promise.all([
            this.messageModel
                .find({ discussionId: new mongoose.Types.ObjectId(discussionId) })
                .sort({ createdAt: -1 })
                .skip((numericPage - 1) * numericLimit)
                .limit(numericLimit)
                .select('_id content sender attachments createdAt reactions')
                .lean(),

            this.messageModel.countDocuments({ discussionId: new mongoose.Types.ObjectId(discussionId) }),
        ]);

        const totalPages = Math.ceil(totalItems / numericLimit);

        return {
            data: messages as any,
            page: numericPage,
            total: totalItems,
            totalPages,
        };
    }

    /**
     * Searches for messages within a specific discussion using a query string.
     * Verifies user participation before delegating the search to the dedicated search service.
     * 
     * @param query The search term.
     * @param discussionId The ID of the discussion to search in.
     * @param userId The ID of the user performing the search.
     * @param options Pagination and search options.
     * @returns A list of messages matching the search criteria.
     */
    async searchMessages(query: string, discussionId: string, userId: string, options: RequestPaginationDto) {
        const isParticipant = await this.membershipModel.exists({
            discussionId,
            userId,
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

    /**
     * Synchronizes updated user information across the discussion service.
     * Updates the sender information in all historical messages and the latest message snapshots.
     * 
     * @param user Partial user object containing updated fields like name or avatar.
     */
    async updateUser(user: Partial<User>) {
        const { id, name, avatar } = user;
        if (!id) return;
        try {
            await this.discussionModel.updateMany(
                { 'latestMessageSnapshot.sender._id': id },
                {
                    $set: {
                        'latestMessageSnapshot.sender.name': name,
                        'latestMessageSnapshot.sender.avatar': avatar,
                    }
                }
            );
        } catch (error) {
            this.logger.error(`Failed to update latest snapshot info for ${id}`, error);
        }
    }

    /**
     * Fetches all messages stored in the database.
     * Typically used for administrative purposes or internal migrations.
     * 
     * @returns A promise that resolves to an array of all messages.
     */
    async getAllMessages() {
        return await this.messageModel.find().exec();
    }

    /**
     * Creates and broadcasts a system-level message within a discussion.
     * System messages are used for events like "User joined" or "Team deleted".
     * 
     * @param discussion The discussion document where the message will be sent.
     * @param content The text content of the system message.
     * @returns The saved system message document.
     */
    async sendSystemMessage(
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
            attachments: savedMessage.attachments as any,
            createdAt: savedMessage.createdAt,
        };

        const memberships = await this.membershipModel.find({ discussionId: discussion._id }).lean();
        const participantIds = memberships.map(m => m.userId);

        this.amqp.publish(EVENTS_EXCHANGE, EVENTS.NEW_MESSAGE, {
            _id: savedMessage._id.toString(),
            discussionId: (discussion._id as Types.ObjectId).toString(),
            teamSnapshot: discussion.teamSnapshot,
            messageSnapshot,
            membersToNotify: participantIds,
        } as SendMessageEventPayload);

        return savedMessage;
    }

    /**
     * Helper method to find a discussion by ID and ensure it is accessible.
     * 
     * @param discussionId The ID of the discussion to find.
     * @param userId Optional. If provided, ensures the user is a participant.
     * @returns The discussion document if found and valid.
     * @throws ForbiddenException if discussion is not found, deleted, or user lacks access.
     */
    private async getDiscussionOrFail(discussionId: string, userId?: string) {
        const discussion = await this.discussionModel.findOne({ _id: discussionId, isDeleted: { $ne: true } });
        if (!discussion) throw new NotFoundException('Discussion not found');

        if (userId) {
            const isMember = await this.membershipModel.exists({ discussionId, userId });
            if (!isMember) throw new ForbiddenException('Access denied.');
        }

        return discussion;
    }

    /**
     * Internal implementation for creating a message.
     * Handles database persistence, updates the discussion's latest message snapshot,
     * and publishes a message event to RabbitMQ for real-time delivery.
     * 
     * @param discussion The target discussion.
     * @param sender The snapshot of the sender's info.
     * @param content The message content.
     * @param attachments Optional file attachments.
     * @returns A promise resolving to the created message snapshot.
     */
    private async createMessage(
        discussion: DiscussionDocument,
        sender: SenderSnapshot,
        content: string,
        attachments?: Attachment[],
        replyTo?: ReplySnapshot | null,
    ) {
        const message = new this.messageModel({
            discussionId: discussion._id,
            content,
            attachments,
            sender,
            replyTo: replyTo || undefined,
        });

        const savedMessage = await message.save();

        const messageSnapshot: LatestMessageSnapshot = {
            _id: savedMessage._id.toString(),
            sender,
            content: savedMessage.content,
            attachments: savedMessage.attachments as any,
            createdAt: savedMessage.createdAt,
        };

        discussion.latestMessage = savedMessage._id as any;
        discussion.latestMessageSnapshot = messageSnapshot;
        await discussion.save();

        const payload: SendMessageEventPayload = {
            _id: savedMessage._id.toString(),
            discussionId: (discussion._id as Types.ObjectId).toString(),
            messageSnapshot: discussion.latestMessageSnapshot,
            teamSnapshot: discussion.teamSnapshot as TeamSnapshot,
        };

        this.amqp.publish(EVENTS_EXCHANGE, EVENTS.NEW_MESSAGE, payload);

        const response: ResponseMessageDto = {
            _id: savedMessage._id.toString(),
            discussionId: (discussion._id as Types.ObjectId).toString(),
            message: messageSnapshot as MessageSnapshot
        };
        return response;
    }

    /**
     * Marks all messages in a discussion as read for a specific user.
     * Updates the 'readBy' array in messages where the user hasn't already been recorded.
     * 
     * @param discussionId The ID of the discussion.
     * @param id The ID of the user reading the messages.
     */
    private async markAsRead(discussionId: string, userId: string) {
        try {
            await this.readReceiptModel.findOneAndUpdate(
                { discussionId: new mongoose.Types.ObjectId(discussionId), userId },
                {
                    $set: {
                        lastReadAt: new Date(),
                    }
                },
                { upsert: true }
            );
        } catch (error) {
            this.logger.error(
                `Failed to update read receipt for discussion ${discussionId}`,
                error,
            );
        }
    }
    /**
     * Deletes all messages associated with a set of discussion IDs.
     * Used during permanent deletion of a team/server.
     * 
     * @param discussionIds Array of discussion IDs whose messages should be removed.
     */
    async deleteMessagesByDiscussionIds(discussionIds: string[]) {
        const objectIds = discussionIds.map(id => new mongoose.Types.ObjectId(id));
        return await this.messageModel.deleteMany({ discussionId: { $in: objectIds } });
    }



    async toggleReaction(userId: string, messageId: string, emoji: string) {
        const message = await this.messageModel.findById(messageId);
        if (!message) throw new NotFoundException('Message not found');

        const existingReactionIndex = message.reactions.findIndex(
            (r) => r.userIds.includes(userId) && r.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            message.reactions.push({ userIds: [userId], emoji });
        }

        const savedMessage = await message.save();

        const discussion = await this.discussionModel.findById(message.discussionId).lean();
        if (discussion) {
            const memberships = await this.membershipModel.find({
                discussionId: discussion._id,
                status: MemberShip.ACTIVE
            }).lean();

            const membersToNotify = memberships.map(m => m.userId);

            this.amqp.publish(EVENTS_EXCHANGE, EVENTS.MESSAGE_UPDATED, {
                discussionId: discussion._id.toString(),
                messageId: savedMessage._id.toString(),
                reactions: savedMessage.reactions,
                membersToNotify,
            });
        }

        return savedMessage;
    }
}
