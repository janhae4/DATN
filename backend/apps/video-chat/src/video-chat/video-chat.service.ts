import { CreateCallDto } from '@app/contracts/video-chat/create-call.dto';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideoChatService {
  private readonly logger = new Logger(VideoChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createCall(createCallDto: CreateCallDto) {
    this.logger.log(
      `Người dùng vào phòng chat! Số lượng tham gia: ${createCallDto.participantIds.length}`,
    );

    const call = await this.prisma.call.create({
      data: {
        roomId: createCallDto.roomId, // Lưu roomId vào DB
        participants: {
          create: createCallDto.participantIds.map((userId) => ({ userId })),
        },
      },
    });

    this.logger.log(
      `Đã tạo cuộc gọi mới với ID: ${call.id} cho phòng ${createCallDto.roomId} với ${createCallDto.participantIds.length} người dùng`,
    );
    return call;
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
}
