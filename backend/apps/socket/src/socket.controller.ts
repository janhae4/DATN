import { Controller } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

import {
  EVENTS,
  EVENTS_EXCHANGE,
  NOTIFICATION_PATTERN,
  CHATBOT_PATTERN,
  ResponseStreamDto,
  SOCKET_EXCHANGE,
  CHATBOT_EXCHANGE,
  FILE_PATTERN,
  TASK_PATTERNS,
  NotificationTargetType,
  NotificationType,
  NotificationResource,
} from '@app/contracts';

import type {
  AddMemberEventPayload,
  ChangeRoleMember,
  CreateNotificationDto,
  CreateTeamEventPayload,
  FileStatus,
  LeaveMemberEventPayload,
  MeetingSummaryResponseDto,
  RemoveMemberEventPayload,
  SendMessageEventPayload,
  SendTaskNotificationDto,
  User,
} from '@app/contracts';

import { SocketGateway } from './socket.gateway';
import { customErrorHandler } from '@app/common';
import { NotificationMapper } from '@app/contracts/notification/notification.mapper';

@Controller()
export class SocketController {
  constructor(private readonly socketGateway: SocketGateway) { }

  // @RabbitSubscribe({
  //   exchange: EVENTS_EXCHANGE,
  //   routingKey: EVENTS.LOGIN,
  //   queue: EVENTS.LOGIN,
  //   errorHandler: customErrorHandler
  // })
  // handleLogin(payload: Partial<User>) {
  //   this.socketGateway.publishNotification({
  //     type: NotificationType.LOGIN,
  //     title: 'Login Notification',
  //     message: `You have been logged in successfully`,
  //     targetType: NotificationTargetType.USER,
  //     targetId: payload.id, 
  //     actorId: payload.id,

  //   });
  // }

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
    queue: "events.create.team.notification",
    errorHandler: customErrorHandler
  })
  async handleCreateTeam(payload: CreateTeamEventPayload) {
    const notificationDto = NotificationMapper.fromCreateTeam(payload);
    await this.socketGateway.publishNotification(notificationDto);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: "events.add.member.notification",
    errorHandler: customErrorHandler
  })
  async handleAddMember(payload: AddMemberEventPayload) {
    const notificationDtos = NotificationMapper.fromAddMember(payload);
    await Promise.all(
      notificationDtos.map(dto => this.socketGateway.publishNotification(dto))
    );
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.JOIN_TEAM,
    queue: "events.join.team.notification",
    errorHandler: customErrorHandler
  })
  async handleJoinTeam(payload: {
    teamId: string;
    teamName: string;
    user: User;
    members: string[];
    timeStamp: string;
  }) {
    payload.members.map(async (memberId) => {
      await this.socketGateway.publishNotification({
        type: NotificationType.SUCCESS,
        title: 'Join Team Notification',
        message: `${payload.user.name} has joined the team ${payload.teamName}`,
        targetType: NotificationTargetType.USER,
        targetId: memberId,

        actorId: payload.user.id,
        metadata: {
          action: 'MEMBER_JOINED',
          teamId: payload.teamId
        },
        resourceId: payload.teamId,
        resourceType: NotificationResource.TEAM
      });
    })
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.MEMBER_ROLE_CHANGED,
    queue: "events.role.changed.notification",
    errorHandler: customErrorHandler
  })
  async handleMemberRoleChanged(payload: ChangeRoleMember) {
    const notificationDto = NotificationMapper.fromChangeRole(payload);
    await this.socketGateway.publishNotification(notificationDto);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: "events.remove.member.notification",
    errorHandler: customErrorHandler
  })
  async handleRemoveMember(payload: RemoveMemberEventPayload) {
    console.log(payload.memberIdsToNotify)
    const notificationDtos = NotificationMapper.fromRemoveMember(payload);
    console.log(notificationDtos)
    await Promise.all(
      notificationDtos.map(dto => this.socketGateway.publishNotification(dto))
    );;
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: "events.leave.team.notification",
    errorHandler: customErrorHandler
  })
  async handleLeaveTeam(payload: LeaveMemberEventPayload) {
    const notificationDto = NotificationMapper.fromLeaveTeam(payload);
    await this.socketGateway.publishNotification(notificationDto);
  }

  @RabbitSubscribe({
    exchange: SOCKET_EXCHANGE,
    routingKey: TASK_PATTERNS.SEND_NOTIFICATION,
    queue: TASK_PATTERNS.SEND_NOTIFICATION,
    errorHandler: customErrorHandler
  })
  async notifyTaskUpdate(payload: SendTaskNotificationDto) {
    await this.socketGateway.notifyTaskUpdate(payload);
  }


  @RabbitSubscribe({
    exchange: CHATBOT_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.PROCESS_DOCUMENT,
    queue: NOTIFICATION_PATTERN.PROCESS_DOCUMENT,
    errorHandler: customErrorHandler
  })
  handleGetProcessDocument(event: CreateNotificationDto) {
    this.socketGateway.publishNotification(event);
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