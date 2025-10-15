import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { VideoChatService } from './video-chat.service';
import { VIDEO_CHAT_PATTERNS } from '@app/contracts/video-chat/video-chat.patterns';
import { CreateCallDto } from '@app/contracts/video-chat/create-call.dto';

@Controller()
export class VideoChatController {
  constructor(private readonly videoChatService: VideoChatService) {}

  @MessagePattern(VIDEO_CHAT_PATTERNS.CREATE_CALL)
  createCall(@Payload() createCallDto: CreateCallDto) {
    return this.videoChatService.createCall(createCallDto);
  }

  @MessagePattern(VIDEO_CHAT_PATTERNS.GET_CALL_HISTORY)
  getCallHistory(@Payload() userId: string) {
    return this.videoChatService.getCallHistory(userId);
  }

  @MessagePattern('get-call-history-by-room-id')
  getCallHistoryByRoomId(@Payload() roomId: string) {
    return this.videoChatService.getCallHistoryByRoomId(roomId);
  }

  @MessagePattern('join-room')
  handleJoinRoom(@Payload() data: { clientId: string; roomId: string }) {
    console.log(
      `VideoChat: Client ${data.clientId} joined room ${data.roomId}`,
    );
    // TODO: Add business logic for room joining if needed
    return { success: true, clientId: data.clientId, roomId: data.roomId };
  }

  @MessagePattern('offer')
  handleOffer(
    @Payload()
    data: {
      clientId: string;
      sdp: any;
      roomId: string;
      targetId: string;
    },
  ) {
    console.log(
      `VideoChat: Offer from ${data.clientId} to ${data.targetId} in room ${data.roomId}`,
    );
    // TODO: Add business logic for offer handling if needed
    return {
      success: true,
      type: 'offer',
      from: data.clientId,
      to: data.targetId,
    };
  }

  @MessagePattern('answer')
  handleAnswer(
    @Payload()
    data: {
      clientId: string;
      sdp: any;
      roomId: string;
      targetId: string;
    },
  ) {
    console.log(
      `VideoChat: Answer from ${data.clientId} to ${data.targetId} in room ${data.roomId}`,
    );
    // TODO: Add business logic for answer handling if needed
    return {
      success: true,
      type: 'answer',
      from: data.clientId,
      to: data.targetId,
    };
  }

  @MessagePattern('ice-candidate')
  handleIceCandidate(
    @Payload()
    data: {
      clientId: string;
      candidate: any;
      roomId: string;
      targetId: string;
    },
  ) {
    console.log(
      `VideoChat: ICE candidate from ${data.clientId} to ${data.targetId} in room ${data.roomId}`,
    );
    // TODO: Add business logic for ICE candidate handling if needed
    return {
      success: true,
      type: 'ice-candidate',
      from: data.clientId,
      to: data.targetId,
    };
  }

  @MessagePattern('client-disconnected')
  handleClientDisconnected(@Payload() data: { clientId: string }) {
    console.log(`VideoChat: Client ${data.clientId} disconnected`);
    // TODO: Add cleanup logic if needed
    return { success: true, clientId: data.clientId };
  }
}
