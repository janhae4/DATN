import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CHATBOT_EXCHANGE, CHATBOT_PATTERN, ForbiddenException, MemberRole, NotFoundException, REDIS_EXCHANGE, REDIS_PATTERN, RefType, SOCKET_EXCHANGE, SOCKET_QUEUE, TEAM_EXCHANGE, TEAM_PATTERN, TranscriptSegment, User, USER_EXCHANGE, USER_PATTERNS } from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { unwrapRpcResult } from '@app/common';

@Injectable()
export class VideoChatService {
  private readonly logger = new Logger(VideoChatService.name);

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly prisma: PrismaService
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
        const activeCall = await this.prisma.call.findFirst({
          where: {
            teamId: teamId,
            refId: refId,
            refType: refType,
            endedAt: null
          },
          include: {
            participants: {
              where: { userId }
            }
          }
        });

        if (activeCall) {
          const participant = activeCall.participants[0];

          if (participant && participant.role === 'BANNED') {
            throw new ForbiddenException('You are banned from this call.');
          }

          const participantRole = unwrapRpcResult(
            await this.amqpConnection.request<string>({
              exchange: TEAM_EXCHANGE,
              routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
              payload: { teamId: teamId, userId: userId },
            })
          )

          if (participant && !participant.leftAt) {
            return {
              action: 'JOIN',
              roomId: activeCall.roomId,
              role: participantRole === 'OWNER' ? 'HOST' : participantRole
            };
          }

          await this.prisma.callParticipant.upsert({
            where: {
              callId_userId: {
                callId: activeCall.id,
                userId
              }
            },
            update: {
              leftAt: null,
            },
            create: {
              callId: activeCall.id,
              userId,
              role: participantRole === 'OWNER' ? 'HOST' : participantRole
            }
          });

          return {
            action: 'JOIN',
            roomId: activeCall.roomId
          };
        }
      }

      const newRoomId = this.generateRoomCode();

      await this.prisma.call.create({
        data: {
          roomId: newRoomId,
          teamId,
          refId,
          refType,
          participants: {
            create: { userId, role: 'HOST' }
          },
        }
      });

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
    const history = await this.prisma.call.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    this.logger.log(
      `Người dùng ${userId} đã xem lịch sử cuộc gọi (${history.length} cuộc gọi)`,
    );
    return history;
  }

  async getCallHistoryByRoomId(roomId: string) {
    const history = await this.prisma.call.findMany({
      where: {
        roomId,
      },
      include: {
        participants: true,
      },
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
    console.log('processMeetingSummary', roomId);
    const transcriptsRpc = await this.amqpConnection.request({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.POP_MEETING_BUFFER,
      payload: roomId
    })

    const transcripts: TranscriptSegment[] = unwrapRpcResult(transcriptsRpc);
    transcripts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const conversationText = transcripts
      .map(t => `${t.userName}: ${t.content}`)
      .join("\n");

    const result = await this.amqpConnection.request({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.SUMMARIZE_MEETING,
      payload: {
        roomId,
        content: conversationText,
      },
      timeout: 120000
    })

    const { summary, actionItems } = unwrapRpcResult(result);

    console.log("summary", summary);

    console.log("actionItems", actionItems);

    await this.prisma.$transaction([
      this.prisma.callSummaryBlock.create({
        data: { callId: roomId, content: summary }
      }),
      this.prisma.callActionItem.createMany({
        data: actionItems.map(item => ({
          callId: roomId,
          content: item.content,
          status: 'SUGGESTED'
        }))
      })
    ]);

    console.log(`Đã tổng hợp xong cuộc họp ${roomId}`);
  }


  async kickUser(requesterId: string, targetUserId: string, roomId: string) {
    const call = await this.prisma.call.findUnique({
      where: { roomId },
      include: {
        participants: {
          where: { userId: requesterId, leftAt: null }
        }
      }
    });

    if (!call) throw new NotFoundException('Room not found');

    const requesterParticipant = call.participants[0];
    if (!requesterParticipant) throw new ForbiddenException('You are not in this room');

    this.logger.debug(targetUserId);

    if (requesterParticipant.role === 'HOST') {
      const updateResult = await this.prisma.callParticipant.updateMany({
        where: {
          userId: targetUserId,
          call: { roomId },
          leftAt: null,
        },
        data: {
          leftAt: new Date(),
          role: 'BANNED'
        }
      });

      if (updateResult.count === 0) {
        throw new NotFoundException('Target user is not in the room.');
      }

      const host: Partial<User> = unwrapRpcResult(
        await this.amqpConnection.request({
          exchange: USER_EXCHANGE,
          routingKey: USER_PATTERNS.FIND_ONE,
          payload: requesterId
        })
      )

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

    if (requesterParticipant.role === 'ADMIN') {
      const currentHost = await this.prisma.callParticipant.findFirst({
        where: {
          callId: call.id,
          role: 'HOST',
          leftAt: null
        }
      });

      this.logger.debug("currentHost", currentHost);

      const users: Partial<User>[] = unwrapRpcResult(
        await this.amqpConnection.request({
          exchange: USER_EXCHANGE,
          routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
          payload: { userIds: [requesterId, targetUserId] }
        })
      )

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
        const updateResult = await this.prisma.callParticipant.updateMany({
          where: {
            userId: targetUserId,
            call: { roomId },
            leftAt: null,
          },
          data: {
            leftAt: new Date(),
            role: 'BANNED'
          }
        });

        if (updateResult.count === 0) {
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
    const call = await this.prisma.call.findUnique({
      where: { roomId },
      include: {
        participants: {
          where: { userId: requesterId, leftAt: null }
        }
      }
    });

    if (!call) throw new NotFoundException('Room not found');

    const requesterParticipant = call.participants[0];
    if (!requesterParticipant) throw new ForbiddenException('You are not in this room');

    const performUnkick = async (adminName: string | undefined) => {
      const participantRole = unwrapRpcResult(
        await this.amqpConnection.request<string>({
          exchange: TEAM_EXCHANGE,
          routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
          payload: { roomId, userId: targetUserId }
        })
      );
      const updateResult = await this.prisma.callParticipant.updateMany({
        where: {
          userId: targetUserId,
          call: { roomId },
        },
        data: {
          role: participantRole
        }
      });

      if (updateResult.count === 0) {
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

    const users: Partial<User>[] = unwrapRpcResult(
      await this.amqpConnection.request({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
        payload: { userIds: [requesterId, targetUserId] }
      })
    );
    const requesterInfo = users.find(u => u.id === requesterId);
    const targetUserInfo = users.find(u => u.id === targetUserId);

    if (!requesterInfo || !targetUserInfo) throw new NotFoundException('User not found');

    if (requesterParticipant.role === 'HOST') {
      await performUnkick(requesterInfo.name);
      return { success: true, message: "User has been unbanned." };
    }

    if (requesterParticipant.role === 'ADMIN') {
      const currentHost = await this.prisma.callParticipant.findFirst({
        where: { callId: call.id, role: 'HOST', leftAt: null }
      });

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
    await this.prisma.callParticipant.updateMany({
      where: { userId, call: { roomId }, leftAt: null },
      data: { isSharingScreen: isSharing }
    });

    this.logger.log(`User ${userId} in room ${roomId} is sharing screen: ${isSharing}`);
  }
}