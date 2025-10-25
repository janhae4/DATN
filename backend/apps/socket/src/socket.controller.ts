import { Controller } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

import {
  EVENTS,
  EVENTS_EXCHANGE,
  NOTIFICATION_PATTERN,
  CHATBOT_PATTERN,
  ResponseStreamDto,
  NotificationEventDto,
  User,
  NotificationType,
  SOCKET_EXCHANGE,
  CHATBOT_EXCHANGE,
} from '@app/contracts';

import type { 
  AddMemberEventPayload, 
  ChangeRoleMember, 
  CreateTeamEventPayload, 
  LeaveMember, 
  RemoveMemberEventPayload, 
  SendMessageEventPayload 
} from '@app/contracts';

import { SocketGateway } from './socket.gateway';

@Controller()
export class SocketController {
  constructor(private readonly socketGateway: SocketGateway) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LOGIN,
    queue: EVENTS.LOGIN,
  })
  handleLogin(payload: Partial<User>) {
    this.socketGateway.sendNotificationToUser({
      userId: payload.id ?? '',
      title: 'Login Notification',
      message: 'Logged in successfully',
      type: NotificationType.SUCCESS,
    });
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.NEW_MESSAGE,
    queue: EVENTS.NEW_MESSAGE,
  })
  handleNewMessage(payload: SendMessageEventPayload) {
    this.socketGateway.handleNewMessage(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.CREATE_TEAM,
    queue: "events_socket_create_team",
  })
  handleCreateTeam(payload: CreateTeamEventPayload) {
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

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: "events_socket_add_member",
  })
  handleAddMember(payload: AddMemberEventPayload) {
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

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.MEMBER_ROLE_CHANGED,
    queue: "events_socket_member_role_changed",
  })
  handleMemberRoleChanged(payload: ChangeRoleMember) {
    const { requesterId, teamName, requesterName, newRole } = payload;
    this.socketGateway.sendNotificationToUser({
      userId: requesterId,
      title: `Your role in team ${teamName} has been changed`,
      message: `${requesterName} changed your role in team ${teamName} to ${newRole}`,
      type: NotificationType.SUCCESS,
    });
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: "events_socket_remove_member",
  })
  handleRemoveMember(payload: RemoveMemberEventPayload) {
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

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: "events_socket_leave_team",
  })
  handleLeaveTeam(payload: LeaveMember) {
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

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.SEND,
    queue: "events_socket_send_notification",
  })
  handleSendNotification(event: NotificationEventDto) {
    console.log(event)
    this.socketGateway.sendNotificationToUser(event);
  }

  @RabbitSubscribe({
    exchange: CHATBOT_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.PROCESS_DOCUMENT,
    queue: NOTIFICATION_PATTERN.PROCESS_DOCUMENT,
  })
  handleGetProcessDocument(event: NotificationEventDto) {
    this.socketGateway.sendNotificationToUser(event);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: CHATBOT_PATTERN.STREAM_RESPONSE,
    queue: CHATBOT_PATTERN.STREAM_RESPONSE,
  })
  handleStreamResponse(response: ResponseStreamDto) {
    this.socketGateway.handleStreamResponse(response);
  }
}