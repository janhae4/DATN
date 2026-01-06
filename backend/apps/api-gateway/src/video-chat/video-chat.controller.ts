import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { VideoChatService } from './video-chat.service';
import { CreateCallDto } from '@app/contracts/video-chat/dto/create-call.dto';
import { Role } from '@app/contracts';
import { ApiBody } from '@nestjs/swagger';
import { CurrentUser } from '../common/role/current-user.decorator';
import { RoleGuard } from '../common/role/role.guard';
import { Roles } from '../common/role/role.decorator';

@UseGuards(RoleGuard)
@Controller('video-call')
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) { }

  @Post('join')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        teamId: { type: 'string', example: '4816f5d1-5e0e-481e-8939-7a871d1cea04' },
        refId: { type: 'string', example: '4816f5d1-5e0e-481e-8939-7a871d1cea04' },
        refType: { type: 'string', example: 'TEAM' },
      },
    },
  })
  @Roles(Role.USER, Role.ADMIN)
  createCall(
    @Body() createCallDto: CreateCallDto,
    @CurrentUser('id') userId: string
  ) {
    createCallDto.userId = userId;
    return this.videoChatService.createOrJoinCall(createCallDto);
  }

  @Get('call-history')
  @Roles(Role.USER, Role.ADMIN)
  getCallHistory(@CurrentUser('id') userId: string) {
    return this.videoChatService.getCallHistory(userId);
  }

  @Post('kick')
  @Roles(Role.ADMIN, Role.USER)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', example: 'oBE-FdOU-hTd' },
        targetUserId: { type: 'string', example: 'a0255608-f2ea-4385-8773-c2416a323032' },
      },
    },
  })
  kickUserFromVideoCall(
    @Body() body: { roomId: string; targetUserId: string },
    @CurrentUser('id') requesterId: string
  ) {
    return this.videoChatService.kickUser(requesterId, body.targetUserId, body.roomId);
  }

  @Post('unkick')
  @Roles(Role.ADMIN, Role.USER)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', example: 'oBE-FdOU-hTd' },
        targetUserId: { type: 'string', example: 'a0255608-f2ea-4385-8773-c2416a323032' },
      },
    },
  })
  unKickUserFromVideoCall(
    @Body() body: { roomId: string; targetUserId: string },
    @CurrentUser('id') requesterId: string
  ) {
    return this.videoChatService.unKickUser(requesterId, body.targetUserId, body.roomId);
  }

  @Post('seed')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', example: '123' },
        userId: { type: 'string', example: 'a0255608-f2ea-4385-8773-c2416a323032' },
      },
    },
  }
  )
  async seedTranscripts(
    @Body() body: { roomId: string; userId: string; count?: number }
  ) {
    const { roomId, userId, count = 10 } = body;
    const sampleSentences = [
      "Xin chào mọi người",
      "Hôm nay chúng ta họp về dự án mới",
      "Tôi nghĩ deadline hơi gấp",
      "Cần bổ sung thêm nhân sự cho backend",
      "Frontend đang gặp lỗi hiển thị",
      "Thống nhất là thứ 6 sẽ release nhé",
      "Oke, tôi sẽ tạo ticket",
      "Bye mọi người"
    ];

    console.log(`🚀 Bắt đầu giả lập ${count} tin nhắn cho phòng ${roomId}...`);

    for (let i = 0; i < count; i++) {
      const randomText = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
      await this.videoChatService.handleTranscriptReceive(
        roomId,
        userId,
        `${randomText} (Test ${i + 1})`,
        new Date()
      );
    }

    return { message: `Đã bắn ${count} tin nhắn vào Buffer Redis.` };
  }

  @Post('trigger-summary')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', example: '123' },
      },
    },
  })
  async triggerSummary(@Body() body: { roomId: string }) {
    console.log(`⚡ Kích hoạt tóm tắt thủ công cho phòng ${body.roomId}...`);

    try {
      await this.videoChatService.processMeetingSummary(body.roomId);
      return { message: 'Đã chạy xong tóm tắt. Kiểm tra DB (CallSummaryBlock, CallActionItem)!' };
    } catch (error) {
      return { error: error.message };
    }
  }
}
