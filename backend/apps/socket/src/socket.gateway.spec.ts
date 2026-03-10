import { Test, TestingModule } from '@nestjs/testing';
import { SocketGateway, AuthenticatedSocket } from './socket.gateway';
import { RmqClientService } from '@app/common';
import { Server } from 'socket.io';
import { AUTH_EXCHANGE, AUTH_PATTERN, JwtDto, SendTaskNotificationDto, NotificationTargetType, NotificationResource, CreateNotificationDto, NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN } from '@app/contracts';
import * as cookie from 'cookie';

jest.mock('cookie', () => ({
  parse: jest.fn(),
}));

describe('SocketGateway', () => {
  let gateway: SocketGateway;
  let amqpMock: jest.Mocked<RmqClientService>;
  let socketMock: AuthenticatedSocket;
  let serverMock: any;

  beforeEach(async () => {
    amqpMock = {
      request: jest.fn(),
      publish: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketGateway,
        { provide: RmqClientService, useValue: amqpMock },
      ],
    }).compile();

    gateway = module.get<SocketGateway>(SocketGateway);

    serverMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        adapter: {
          rooms: new Map(),
        },
      },
    };
    gateway.server = serverMock as any as Server;

    socketMock = {
      id: 'socket-123',
      handshake: { headers: { cookie: 'accessToken=mock_token' } },
      disconnect: jest.fn(),
      join: jest.fn(),
      data: {},
    } as any;

    // Mute logs
    jest.spyOn(gateway['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(gateway['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(gateway['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(gateway['logger'], 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate user and join room', async () => {
      (cookie.parse as jest.Mock).mockReturnValue({ accessToken: 'valid_token' });
      const mockUser = { id: 'user-auth-1' } as JwtDto;
      amqpMock.request.mockResolvedValueOnce(mockUser);

      await gateway.handleConnection(socketMock);

      expect(amqpMock.request).toHaveBeenCalledWith({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
        payload: { token: 'valid_token' },
      });
      expect(socketMock.data.user).toEqual(mockUser);
      expect(socketMock.join).toHaveBeenCalledWith(mockUser.id);
      expect(socketMock.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect if token is missing', async () => {
      (cookie.parse as jest.Mock).mockReturnValue({});

      await gateway.handleConnection(socketMock);

      expect(amqpMock.request).not.toHaveBeenCalled();
      expect(socketMock.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if amqp user validation fails', async () => {
      (cookie.parse as jest.Mock).mockReturnValue({ accessToken: 'invalid_token' });
      amqpMock.request.mockResolvedValueOnce(null);

      await gateway.handleConnection(socketMock);

      expect(socketMock.disconnect).toHaveBeenCalled();
      expect(socketMock.join).not.toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should emit user_left_video if client was in a video room', () => {
      socketMock.data.videoRoomId = 'room-vid-456';
      socketMock.data.user = { id: 'user-789' } as JwtDto;

      gateway.handleDisconnect(socketMock);

      expect(serverMock.to).toHaveBeenCalledWith('room-vid-456');
      expect(serverMock.emit).toHaveBeenCalledWith('user_left_video', {
        socketId: 'socket-123',
        userId: 'user-789'
      });
    });

    it('should not emit video room events if user was not in a video room', () => {
      socketMock.data.user = { id: 'user-789' } as JwtDto;

      gateway.handleDisconnect(socketMock);

      expect(serverMock.to).not.toHaveBeenCalled();
      expect(serverMock.emit).not.toHaveBeenCalled();
    });
  });

  describe('notifyTaskUpdate', () => {
    const payload: SendTaskNotificationDto = {
      teamId: 'team-1',
      taskIds: ['task-123'],
      action: 'APPROVED',
      actor: { id: 'actor-1', name: 'John Doe', avatar: 'img.png' },
      details: { taskTitle: 'Fix Bug 1' },
      projectId: 'proj-1'
    };

    it('should broadcast task update over socket and publish notification via MQ', async () => {
      await gateway.notifyTaskUpdate(payload);

      // Verify Socket Emission
      expect(serverMock.to).toHaveBeenCalledWith('team-1');
      expect(serverMock.emit).toHaveBeenCalledWith('task_update', payload);

      // Verify MQ Notification creation
      expect(amqpMock.request).toHaveBeenCalledWith({
        exchange: NOTIFICATION_EXCHANGE,
        routingKey: NOTIFICATION_PATTERN.CREATE,
        payload: {
          title: 'Task Update',
          message: 'John Doe approved task "Fix Bug 1"',
          type: 'SUCCESS',
          targetType: NotificationTargetType.TEAM,
          targetId: 'team-1',
          resourceType: NotificationResource.TASK,
          resourceId: 'task-123',
          actorId: 'actor-1',
          metadata: { action: 'APPROVED', originalUrl: "" }
        } as CreateNotificationDto
      });
    });
  });

  describe('publishNotification', () => {
    it('should emit to socket room and request RMQ to store notification', async () => {
      const dto = { targetId: 'user-target-1', title: 'Hello', message: 'Test message' } as any;

      await gateway.publishNotification(dto);

      expect(serverMock.to).toHaveBeenCalledWith('user-target-1');
      expect(serverMock.emit).toHaveBeenCalledWith('notification', dto);
      expect(amqpMock.request).toHaveBeenCalledWith({
        exchange: NOTIFICATION_EXCHANGE,
        routingKey: NOTIFICATION_PATTERN.CREATE,
        payload: dto
      });
    });
  });
});
