import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { VideoChatService } from './video-chat.service';
import { CreateCallDto } from '@app/contracts/video-chat/create-call.dto';
import type { Request } from 'express';
import { JwtDto } from '@app/contracts/auth/jwt.dto';

@Controller('video-chat')
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) {}

  @Post('create-call')
  createCall(@Body() createCallDto: CreateCallDto) {
    return this.videoChatService.createCall(createCallDto);
  }

  @Get('call-history')
  getCallHistory(@Req() req: Request, @Query('roomId') roomId?: string) {
    const payload = req.user as JwtDto;

    if (roomId) {
      return this.videoChatService.getCallHistoryByRoomId(roomId);
    }

    if (payload) {
      return this.videoChatService.getCallHistory(payload.id);
    }

    throw new BadRequestException('roomId or user authentication required');
  }
}
