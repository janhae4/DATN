import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, In } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  CallTranscript,
  CHATBOT_EXCHANGE, CHATBOT_PATTERN, MemberRole, REDIS_EXCHANGE,
  REDIS_PATTERN, SOCKET_EXCHANGE, TEAM_EXCHANGE, TEAM_PATTERN,
  User, USER_EXCHANGE, USER_PATTERNS
} from '@app/contracts';

import { unwrapRpcResult } from '@app/common';
import { TranscriptSegment } from '@app/contracts/video-chat/dto/transcript.dto';
import { CallActionItem } from '@app/contracts/video-chat/entities/call-action-item.entity';
import { CallParticipant, CallRole } from '@app/contracts/video-chat/entities/call-participant.entity';
import { CallSummaryBlock } from '@app/contracts/video-chat/entities/call-summary-block.entity';
import { Call } from '@app/contracts/video-chat/entities/call.entity';
import { RefType } from '@app/contracts';

@Injectable()
export class VideoChatService {
  private readonly logger = new Logger(VideoChatService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,

    @InjectRepository(Call)
    private readonly callRepo: Repository<Call>,

    @InjectRepository(CallParticipant)
    private readonly participantRepo: Repository<CallParticipant>,

    @InjectRepository(CallSummaryBlock)
    private readonly summaryRepo: Repository<CallSummaryBlock>,

    @InjectRepository(CallActionItem)
    private readonly actionItemRepo: Repository<CallActionItem>,

    // Inject DataSource để dùng Transaction
    private readonly dataSource: DataSource,
  ) { }

  private generateRoomCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const part1 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part2 = Array(4).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    const part3 = Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');

    return `${part1}-${part2}-${part3}`;
  }

  private async verifyPermission(userId: string, teamId: string, roles: MemberRole[]) {
    return unwrapRpcResult(await this.amqpConnection.request<boolean>({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { teamId: teamId, userId: userId, roles: roles }
    }))
  }

  async createOrJoinCall(userId: string, teamId: string, refId?: string, refType?: RefType) {
    try {
      await this.verifyPermission(userId, teamId, [MemberRole.ADMIN, MemberRole.MEMBER, MemberRole.OWNER]);

      console.log('createOrJoinCall params:', { userId, teamId, refId, refType });

      if (refId && refType) {

        const activeCall = await this.callRepo.findOne({
          where: {
            teamId,
            refId,
            refType,
            endedAt: IsNull()
          }
        });

        if (activeCall) {
            const participant = await this.participantRepo.findOne({
            where: { callId: activeCall.id, userId }
          });

          if (participant && participant.role === CallRole.BANNED) {
            throw new ForbiddenException('You are banned from this call.');
          }

          const participantRole = unwrapRpcResult(
            await this.amqpConnection.request<string>({
              exchange: TEAM_EXCHANGE,
              routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
              payload: { teamId: teamId, userId: userId },
            })
          );

          // Map role từ string sang Enum của DB
          const dbRole = participantRole === 'OWNER' ? CallRole.HOST : (participantRole as CallRole);

          if (participant && !participant.leftAt) {
            return {
              action: 'JOIN',
              roomId: activeCall.roomId,
              role: dbRole
            };
          }

          // Upsert participant (Nếu chưa có thì tạo, có rồi thì update leftAt = null)
          // TypeORM upsert dựa trên conflict paths (unique constraint: [callId, userId])
          await this.participantRepo.upsert(
            {
              callId: activeCall.id,
              userId,
              leftAt: null,
              role: dbRole
            },
            ['callId', 'userId']
          );

          return {
            action: 'JOIN',
            roomId: activeCall.roomId
          };
        }
      }

      // Tạo room mới
      const newRoomId = this.generateRoomCode();
      const newCall = this.callRepo.create({
        roomId: newRoomId,
        teamId,
        refId,
        refType,
        participants: [
          // TypeORM cho phép tạo relation lồng nhau khi save cascade
          { userId, role: CallRole.HOST }
        ]
      });

      await this.callRepo.save(newCall);

      return {
        action: 'CREATED',
        roomId: newRoomId
      };

    } catch (error) {
      console.error("❌ Lỗi trong createOrJoinCall:", error);
      throw error;
    }
  }

  async getCallHistory(userId: string) {
    // Sử dụng QueryBuilder để lọc các cuộc gọi mà userId đã tham gia
    // Logic: Select Call join với Participant(userId) -> lấy được Call ID -> Load lại Call + All Participants
    const history = await this.callRepo.createQueryBuilder('call')
      .innerJoin('call.participants', 'filterParticipant', 'filterParticipant.userId = :userId', { userId })
      .leftJoinAndSelect('call.participants', 'allParticipants') // Load tất cả participants của call đó
      .getMany();

    this.logger.log(
      `Người dùng ${userId} đã xem lịch sử cuộc gọi (${history.length} cuộc gọi)`,
    );
    return history;
  }

  async getCallHistoryByRoomId(roomId: string) {
    const history = await this.callRepo.find({
      where: { roomId },
      relations: ['participants'], // Load relation
    });

    this.logger.log(
      `Lấy lịch sử cuộc gọi cho roomId: ${roomId} (${history.length} cuộc gọi)`,
    );
    return history;
  }

  async handleTranscriptReceive(roomId: string, userId: string, content: string, timestamp: Date) {
    console.log('handleTranscriptReceive', userId);
    const user = unwrapRpcResult(await this.amqpConnection.request<Partial<User>>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE,
      payload: userId
    }))

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.debug(user);

    const rpc = await this.amqpConnection.request({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.PUSH_MEETING_BUFFER,
      payload: {
        roomId,
        userId,
        userName: user.name,
        content,
        timestamp
      }
    })

    const lenBuffer = unwrapRpcResult(rpc);
    this.logger.log(`Pushed transcript to buffer. RoomId: ${roomId}, UserId: ${userId}, Length of buffer: ${lenBuffer}`);

    if (lenBuffer >= 100) {
      this.processMeetingSummary(roomId).catch(err => console.error(err));
    }
  }

 async processMeetingSummary(roomId: string) {
    this.logger.log(`Processing meeting summary for Room: ${roomId}`);

    // Kiểm tra cuộc gọi có tồn tại không
    const call = await this.callRepo.findOne({ where: { roomId }, select: ['id'] });
    if (!call) {
      this.logger.error(`Call with roomId ${roomId} not found for summary processing`);
      return;
    }

    // 1. Lấy dữ liệu Transcript từ Redis Buffer
    const transcriptsRpc = await this.amqpConnection.request({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.POP_MEETING_BUFFER,
      payload: roomId
    });

    const transcripts: TranscriptSegment[] = unwrapRpcResult(transcriptsRpc);

    // Nếu không có transcript nào thì dừng
    if (!transcripts || transcripts.length === 0) {
        this.logger.warn(`No transcripts found for room ${roomId}`);
        return;
    }

    // 2. Sắp xếp transcript theo thời gian (Tăng dần)
    transcripts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Format text để gửi cho AI (Dạng "User A: Hello world")
    const conversationText = transcripts
      .map(t => `${t.userName}: ${t.content}`)
      .join("\n");

    try {
        // 3. Gọi AI để tóm tắt hội thoại
        const result = await this.amqpConnection.request({
            exchange: CHATBOT_EXCHANGE,
            routingKey: CHATBOT_PATTERN.SUMMARIZE_MEETING,
            payload: {
                roomId,
                content: conversationText,
            },
            timeout: 120000 // 2 phút timeout
        });

        const { summary, actionItems } = unwrapRpcResult(result);

        this.logger.log(`AI Summary generated for Room ${roomId}. Saving to DB...`);

        // 4. LƯU DỮ LIỆU VÀO DB (Sử dụng Transaction)
        await this.dataSource.transaction(async (manager) => {
            const transcriptEntities = transcripts.map(t => manager.create(CallTranscript, {
                callId: call.id,
                userId: t.userId,
                content: t.content, 
                timestamp: new Date(t.timestamp)
            }));
            
            await manager.save(transcriptEntities);

            const summaryBlock = manager.create(CallSummaryBlock, {
                callId: call.id,
                content: summary,
            });
            await manager.save(summaryBlock);

            if (actionItems && actionItems.length > 0) {
                const items = actionItems.map(item => manager.create(CallActionItem, {
                    callId: call.id,
                    content: item.content,
                    status: 'SUGGESTED', 
                }));
                await manager.save(items);
            }
        });

        this.logger.log(`✅ Đã lưu thành công Transcript, Summary & Action Items cho phòng ${roomId}`);

    } catch (error) {
        this.logger.error(`❌ Lỗi khi xử lý tổng kết cuộc họp ${roomId}:`, error);
    }
}

  async kickUser(requesterId: string, targetUserId: string, roomId: string) {

    const call = await this.callRepo.findOne({
      where: { roomId },
      relations: ['participants']
    });

    if (!call) throw new NotFoundException('Room not found');

    const requesterParticipant = call.participants.find(p => p.userId === requesterId && p.leftAt === null);
    if (!requesterParticipant) throw new ForbiddenException('You are not in this room');

    this.logger.debug(targetUserId);

    if (requesterParticipant.role === CallRole.HOST) {
      const updateResult = await this.participantRepo.update(
        { userId: targetUserId, callId: call.id, leftAt: IsNull() },
        { leftAt: new Date(), role: CallRole.BANNED }
      );

      if (updateResult.affected === 0) {
        throw new NotFoundException('Target user is not in the room.');
      }

      const host = unwrapRpcResult(
        await this.amqpConnection.request({
          exchange: USER_EXCHANGE,
          routingKey: USER_PATTERNS.FIND_ONE,
          payload: requesterId
        })
      );

      this.amqpConnection.publish(
        SOCKET_EXCHANGE,
        'socket.video-call.user-kicked',
        {
          targetUserId,
          message: `You have been banned by ${host.name} from room ${roomId}.`,
          roomId
        }
      );

      return { success: true, message: "User has been kicked and banned." };
    }

    if (requesterParticipant.role === CallRole.ADMIN) {
      const currentHost = call.participants.find(p => p.role === CallRole.HOST && p.leftAt === null);

      this.logger.debug("currentHost", currentHost);

      const users = unwrapRpcResult(
        await this.amqpConnection.request({
          exchange: USER_EXCHANGE,
          routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
          payload: { userIds: [requesterId, targetUserId] }
        })
      );

      this.logger.debug("users", users);

      const requester = users.find(user => user.id === requesterId);
      const targetUser = users.find(user => user.id === targetUserId);

      if (!requester || !targetUser) {
        throw new NotFoundException('User not found');
      }

      if (currentHost) {
        this.amqpConnection.publish(
          SOCKET_EXCHANGE,
          'socket.video-call.request-kick',
          {
            hostUserId: currentHost.userId,
            targetUserId,
            roomId,
            message: `${requester.name} requests to kick ${targetUser.name}.`,
          }
        );
        return { success: true, message: "Your request has been sent to the host" };
      } else {
        const updateResult = await this.participantRepo.update(
          { userId: targetUserId, callId: call.id, leftAt: IsNull() },
          { leftAt: new Date(), role: CallRole.BANNED }
        );

        if (updateResult.affected === 0) {
          throw new NotFoundException('Target user is not in the room to kick.');
        }

        this.amqpConnection.publish(
          SOCKET_EXCHANGE,
          'socket.video-call.user-kicked',
          {
            targetUserId,
            message: `You have been kicked by ${requester.name} from room ${roomId}.`,
          }
        );

        return { success: true, message: "Host is offline. User has been kicked by Admin." };
      }
    }

    throw new ForbiddenException('You do not have permission to kick users.');
  }

  async unKickUser(requesterId: string, targetUserId: string, roomId: string) {
    const call = await this.callRepo.findOne({
      where: { roomId },
      relations: ['participants']
    });

    if (!call) throw new NotFoundException('Room not found');

    const requesterParticipant = call.participants.find(p => p.userId === requesterId && p.leftAt === null);
    if (!requesterParticipant) throw new ForbiddenException('You are not in this room');

    const performUnkick = async (adminName: string | undefined) => {
      const participantRole = unwrapRpcResult(
        await this.amqpConnection.request({
          exchange: TEAM_EXCHANGE,
          routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
          payload: { roomId, userId: targetUserId }
        })
      );

      const dbRole = participantRole === 'OWNER' ? CallRole.HOST : (participantRole as CallRole);

      // Unban logic: Tìm record đang bị Banned của user trong call này và restore role
      // Lưu ý: leftAt có thể vẫn giữ nguyên nếu logic là chỉ unban cho lần vào sau, 
      // nhưng thường unkick nghĩa là cho phép join lại -> role hết BANNED.
      const updateResult = await this.participantRepo.update(
        { userId: targetUserId, callId: call.id }, // Update record cũ
        { role: dbRole }
      );

      if (updateResult.affected === 0) {
        throw new NotFoundException('User record not found to unban.');
      }

      this.amqpConnection.publish(
        SOCKET_EXCHANGE,
        'socket.video-call.user-unkicked',
        {
          targetUserId,
          message: `${adminName} has unbanned you from ${roomId}.`,
        }
      );
    };

    const users = unwrapRpcResult(
      await this.amqpConnection.request({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
        payload: { userIds: [requesterId, targetUserId] }
      })
    );
    const requesterInfo = users.find(u => u.id === requesterId);
    const targetUserInfo = users.find(u => u.id === targetUserId);

    if (!requesterInfo || !targetUserInfo) throw new NotFoundException('User not found');

    if (requesterParticipant.role === CallRole.HOST) {
      await performUnkick(requesterInfo.name);
      return { success: true, message: "User has been unbanned." };
    }

    if (requesterParticipant.role === CallRole.ADMIN) {
      const currentHost = call.participants.find(p => p.role === CallRole.HOST && p.leftAt === null);

      if (currentHost) {
        this.amqpConnection.publish(
          SOCKET_EXCHANGE,
          'socket.video-call.request-unkick',
          {
            hostUserId: currentHost.userId,
            targetUserId,
            roomId,
            message: `${requesterInfo.name} requests to unban ${targetUserInfo.name}.`,
          }
        );
        return { success: true, message: "Your request has been sent to the host" };
      }
      else {
        await performUnkick(requesterInfo.name);
        return { success: true, message: "Host is offline. User unbanned by Admin." };
      }
    }

    throw new ForbiddenException('Permission denied');
  }

  async updateScreenShareStatus(userId: string, roomId: string, isSharing: boolean) {
    // Cần lấy callId trước vì update query relation phức tạp
    const call = await this.callRepo.findOne({ where: { roomId }, select: ['id'] });
    if (!call) return;

    await this.participantRepo.update(
      { userId, callId: call.id, leftAt: IsNull() },
      { isSharingScreen: isSharing }
    );

    this.logger.log(`User ${userId} in room ${roomId} is sharing screen: ${isSharing}`);
  }
}