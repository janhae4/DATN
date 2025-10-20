import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CHATBOT_PATTERN, NOTIFICATION_PATTERN, NotificationEventDto, ResponseStreamDto } from '@app/contracts';
import { SocketGateway } from './socket.gateway';

@Controller()
export class SocketController {
  constructor(
    private readonly socketGateway: SocketGateway,
  ) { }

  @EventPattern(NOTIFICATION_PATTERN.SEND)
  handleSendNotification(@Payload() event: NotificationEventDto) {
    this.socketGateway.sendNotificationToUser(event);
  }

  @EventPattern(NOTIFICATION_PATTERN.PROCESS_DOCUMENT)
  handleGetProcessDocument(@Payload() event: NotificationEventDto) {
    this.socketGateway.sendNotificationToUser(event);
  }

  @EventPattern(CHATBOT_PATTERN.STREAM_RESPONSE)
  handleStreamResponse(@Payload() response: ResponseStreamDto) {
    this.socketGateway.handleStreamResponse(response);
  }

}
