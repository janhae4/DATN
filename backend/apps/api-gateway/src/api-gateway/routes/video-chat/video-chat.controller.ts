import { Controller, Post, Body, Get, Req, Query, BadRequestException } from '@nestjs/common';
import { VideoChatService } from './video-chat.service';
import { CreateCallDto } from '@app/contracts/video-chat/create-call.dto';

@Controller('video-chat')
export class VideoChatController {

  constructor(private readonly videoChatService: VideoChatService) { }

  @Post('create-call')
  createCall(@Body() createCallDto: CreateCallDto) {
    return this.videoChatService.createCall(createCallDto);
  }

  @Get('call-history')
  getCallHistory(@Query('roomId') roomId?: string, @Req() req?: any) {
    if (roomId) {
      return this.videoChatService.getCallHistoryByRoomId(roomId);
    } else if (req.user?.id) {
      return this.videoChatService.getCallHistory(req.user.id);
    }
    throw new BadRequestException('roomId or user authentication required');
  }
}