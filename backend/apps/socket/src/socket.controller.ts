import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import {
  ChangeRoleMember,
  CHATBOT_PATTERN,
  EVENTS,
  LeaveMember,
  NOTIFICATION_PATTERN,
  NotificationEventDto,
  NotificationType,
  ResponseStreamDto,
  User,
} from '@app/contracts';
import type {
  AddMemberEventPayload,
  CreateTeamEventPayload,
  RemoveMemberEventPayload,
  SendMessageEventPayload,
} from '@app/contracts';
import { SocketGateway } from './socket.gateway';

@Controller()
export class SocketController {
  constructor(private readonly socketGateway: SocketGateway) {}

  @EventPattern(EVENTS.LOGIN)
  handleLogin(@Payload() payload: Partial<User>) {
    this.socketGateway.sendNotificationToUser({
      userId: payload.id ?? '',
      title: 'Login Notification',
      message: 'Logged in successfully',
      type: NotificationType.SUCCESS,
    });
  }

  @EventPattern(EVENTS.NEW_MESSAGE)
  handleNewMessage(@Payload() payload: SendMessageEventPayload) {
    console.log(payload.content);
    this.socketGateway.handleNewMessage(payload);
  }

  @EventPattern(EVENTS.CREATE_TEAM)
  handleCreateTeam(@Payload() payload: CreateTeamEventPayload) {
    const { members, name, createdAt, ownerName } = payload;
    members.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m.id,
        title: `You have been added to team ${name}`,
        message: `User ${ownerName} created team ${name} at ${createdAt.toISOString()}`,
        type: NotificationType.SUCCESS,
      }),
    );
  }

  @EventPattern(EVENTS.ADD_MEMBER)
  handleAddMember(@Payload() payload: AddMemberEventPayload) {
    const { members, requesterName, teamName } = payload;
    members.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m.id,
        title: `You have been added to team ${teamName}`,
        message: `User ${requesterName} added you to team ${teamName}`,
        type: NotificationType.SUCCESS,
      }),
    );
  }

  @EventPattern(EVENTS.MEMBER_ROLE_CHANGED)
  handleMemberRoleChanged(@Payload() payload: ChangeRoleMember) {
    const { requesterId, teamName, requesterName, newRole } = payload;
    this.socketGateway.sendNotificationToUser({
      userId: requesterId,
      title: `Your role in team ${teamName} has been changed`,
      message: `${requesterName} changed your role in team ${teamName} to ${newRole}`,
      type: NotificationType.SUCCESS,
    });
  }

  @EventPattern(EVENTS.REMOVE_MEMBER)
  handleRemoveMember(@Payload() payload: RemoveMemberEventPayload) {
    const { requesterName, teamName, memberIds } = payload;
    memberIds.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m,
        title: `You have been removed from team ${teamName}`,
        message: `${requesterName} removed you from team ${teamName}`,
        type: NotificationType.SUCCESS,
      }),
    );
  }

  @EventPattern(EVENTS.LEAVE_TEAM)
  handleLeaveTeam(@Payload() payload: LeaveMember) {
    const { requesterName, teamName, memberIds = [] } = payload;
    memberIds.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m,
        title: `A member has left team ${teamName}`,
        message: `${requesterName} left`,
        type: NotificationType.SUCCESS,
      }),
    );
  }

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

  @MessagePattern(EVENTS.NEW_MESSAGE)
  handleNewMessages(@Payload() payload: SendMessageEventPayload) {
    this.socketGateway.handleNewMessage(payload);
  }
}
