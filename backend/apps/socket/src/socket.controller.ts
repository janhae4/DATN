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
  TEAM_PATTERN,
  FILE_PATTERN,
} from '@app/contracts';

import type {
  AddMemberEventPayload,
  ChangeRoleMember,
  CreateTeamEventPayload,
  FileStatus,
  LeaveMemberEventPayload,
  MeetingSummaryResponseDto,
  RemoveMemberEventPayload,
  RemoveTeamEventPayload,
  SendMessageEventPayload,
  SendTeamNotificationDto
} from '@app/contracts';

import { SocketGateway } from './socket.gateway';
import { customErrorHandler } from '@app/common';

@Controller()
export class SocketController {
  constructor(private readonly socketGateway: SocketGateway) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LOGIN,
    queue: EVENTS.LOGIN,
    errorHandler: customErrorHandler
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
    errorHandler: customErrorHandler
  })
  handleNewMessage(payload: SendMessageEventPayload) {
    this.socketGateway.handleNewMessage(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.CREATE_TEAM,
    queue: "events.create.team.socket",
    errorHandler: customErrorHandler
  })
  handleCreateTeam(payload: CreateTeamEventPayload) {
    const { membersToNotify, createdAt, owner, teamSnapshot } = payload;
    const createAtDate = new Date(createdAt);
    membersToNotify.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m,
        title: `You have been added to team ${teamSnapshot.name}`,
        message: `User ${owner.name} created team ${teamSnapshot.name} at ${createAtDate.toISOString()}`,
        type: NotificationType.SUCCESS,
      }),
    );
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: "events_socket_add_member",
    errorHandler: customErrorHandler
  })
  handleAddMember(payload: AddMemberEventPayload) {
    const { members, requesterName, teamName, teamId } = payload;
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
    errorHandler: customErrorHandler
  })
  handleMemberRoleChanged(payload: ChangeRoleMember) {
    const { requesterId, teamName, requesterName, newRole, teamId } = payload;
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
    errorHandler: customErrorHandler
  })
  handleRemoveMember(payload: RemoveMemberEventPayload) {
    const { requesterName, teamName, memberIdsToNotify: memberIds = [], teamId } = payload;
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
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: "events_socket_team_deleted",
    errorHandler: customErrorHandler
  })
  handleTeamDeleted(payload: RemoveTeamEventPayload) {
    const { requesterName, requesterId, teamName, teamId, memberIdsToNotify: memberIds } = payload;
    memberIds.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m,
        title: `Team ${teamName} has been deleted`,
        message: `${m === requesterId ? 'You' : requesterName} deleted team ${teamName}`,
        type: NotificationType.SUCCESS,
      }),
    );
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: "events_socket_leave_team",
    errorHandler: customErrorHandler
  })
  handleLeaveTeam(payload: LeaveMemberEventPayload) {
    const { requester, memberIdsToNotify: memberIds = [], teamName } = payload;
    memberIds.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m,
        title: `A member has left team ${teamName}`,
        message: `${requester.name} left`,
        type: NotificationType.SUCCESS,
      }),
    );
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_TEAM,
    queue: "events_socket_remove_team",
    errorHandler: customErrorHandler
  })
  handleRemoveTeam(payload: RemoveTeamEventPayload) {
    const { requesterName, teamName, memberIdsToNotify: memberIds } = payload;
    memberIds.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m,
        title: `Team ${teamName} has been deleted`,
        message: `${m === requesterName ? 'You' : requesterName} deleted team ${teamName}`,
        type: NotificationType.FAILED,
      }),
    );
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.SEND,
    queue: "events_socket_send_notification",
    errorHandler: customErrorHandler
  })
  handleSendNotification(event: NotificationEventDto) {
    this.socketGateway.sendNotificationToUser(event);
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: TEAM_PATTERN.SEND_NOTIFICATION,
    queue: TEAM_PATTERN.SEND_NOTIFICATION,
    errorHandler: customErrorHandler
  })
  handleTeamSendNotification(event: SendTeamNotificationDto) {
    const { members, message } = event;

    members.map((m) =>
      this.socketGateway.sendNotificationToUser({
        userId: m,
        title: message.title,
        message: message.message,
        type: message.type,
      }),
    );
  }

  @RabbitSubscribe({
    exchange: CHATBOT_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.PROCESS_DOCUMENT,
    queue: NOTIFICATION_PATTERN.PROCESS_DOCUMENT,
    errorHandler: customErrorHandler
  })
  handleGetProcessDocument(event: NotificationEventDto) {
    this.socketGateway.sendNotificationToUser(event);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: CHATBOT_PATTERN.STREAM_RESPONSE,
    queue: CHATBOT_PATTERN.STREAM_RESPONSE,
    errorHandler: customErrorHandler
  })
  async handleStreamResponse(response: ResponseStreamDto) {
    await this.socketGateway.handleStreamResponse(response);
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: CHATBOT_PATTERN.RESPONSE_SUMMARIZE_MEETING,
    queue: CHATBOT_PATTERN.RESPONSE_SUMMARIZE_MEETING,
    errorHandler: customErrorHandler
  })
  async handleSummarizeMeetingResponse(response: MeetingSummaryResponseDto) {
    await this.socketGateway.handleMeetingSummaryStream(response);
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: 'socket.video-call.request-unkick',
    queue: 'socket.video-call.request-unkick',
    errorHandler: customErrorHandler
  })
  async handleUnKickUser(payload: {
    hostUserId: string,
    message: string,
    roomId: string,
    targetUserId: string
  }) {
    await this.socketGateway.sendUnKickRequestToHost(payload.hostUserId, payload.message, payload.roomId, payload.targetUserId);
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: 'socket.video-call.request-kick',
    queue: 'socket.video-call.request-kick',
    errorHandler: customErrorHandler
  })
  async handleKickUser(payload: {
    hostUserId: string,
    message: string,
    roomId: string,
    targetUserId: string
  }) {
    await this.socketGateway.sendKickRequestToHost(payload.hostUserId, payload.message, payload.roomId, payload.targetUserId);
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: 'socket.video-call.user-kicked',
    queue: 'socket.video-call.user-kicked',
    errorHandler: customErrorHandler
  })
  async handleUserKicked(payload: { targetUserId: string, roomId: string, message: string }) {
    await this.socketGateway.notifyUserKicked(payload.targetUserId, payload.message, payload.roomId);
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: 'socket.video-call.user-unkicked',
    queue: 'socket.video-call.user-unkicked',
    errorHandler: customErrorHandler
  })
  async handleUserUnKicked(payload: { targetUserId: string, roomId: string, message: string }) {
    await this.socketGateway.notifyUserUnKicked(payload.targetUserId, payload.message, payload.roomId);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: FILE_PATTERN.FILE_STATUS,
    queue: 'events_socket_file_status',
    errorHandler: customErrorHandler
  })
  handleFileStatus(payload: { fileId: string, fileName: string, status: FileStatus, userId: string, teamId?: string }) {
    console.log(payload)
    this.socketGateway.handleFileStatus(
      payload.fileId,
      payload.fileName,
      payload.status,
      payload.userId,
      payload.teamId,
    );
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: FILE_PATTERN.COMPLETE_UPLOAD,
    queue: FILE_PATTERN.COMPLETE_UPLOAD,
    errorHandler: customErrorHandler
  })
  handleCompleteUpload(payload: { fileId: string, status: FileStatus, userId: string, teamId?: string }) {
    this.socketGateway.handleUploadCompletion(payload.fileId, payload.status, payload.userId, payload.teamId);
  }
}