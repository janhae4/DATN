import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { RmqClientService } from '@app/common';
import { RedisService } from '@app/redis-service';
import { Socket, Server } from 'socket.io';
import { AUTH_EXCHANGE, AUTH_PATTERN, JwtDto } from '@app/contracts';
import * as cookie from 'cookie';

jest.mock('cookie', () => ({
  parse: jest.fn(),
}));

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let amqpConnectionMock: jest.Mocked<RmqClientService>;
  let redisServiceMock: any;
  let redisClientMock: any;
  let socketMock: any;
  let serverMock: any;

  beforeEach(async () => {
    amqpConnectionMock = {
      request: jest.fn(),
      publish: jest.fn(),
    } as any;

    redisClientMock = {
      set: jest.fn(),
      del: jest.fn(),
      mget: jest.fn(),
    };

    redisServiceMock = {
      getClient: jest.fn().mockReturnValue(redisClientMock),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: RmqClientService, useValue: amqpConnectionMock },
        { provide: RedisService, useValue: redisServiceMock },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);

    serverMock = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        sockets: new Map(),
      },
    };
    gateway.server = serverMock as any as Server;

    socketMock = {
      id: 'socket-id-123',
      handshake: { headers: { cookie: 'accessToken=mock_token' } },
      disconnect: jest.fn(),
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      data: {},
    };

    jest.spyOn(gateway['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(gateway['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(gateway['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Connection & Room Flow', () => {
    it('should successfully authenticate and connect a user', async () => {
      // Mock cookie parsing
      (cookie.parse as jest.Mock).mockReturnValue({ accessToken: 'valid_token' });
      
      const mockUser = { id: 'user-123' } as JwtDto;
      amqpConnectionMock.request.mockResolvedValueOnce(mockUser);

      await gateway.handleConnection(socketMock as Socket);

      expect(amqpConnectionMock.request).toHaveBeenCalledWith({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
        payload: { token: 'valid_token' },
      });

      expect(socketMock.data.user).toEqual(mockUser);
      expect(socketMock.join).toHaveBeenCalledWith('user-123');
      expect(redisClientMock.set).toHaveBeenCalledWith('user:online:user-123', 'true', 'EX', 45);
      expect(socketMock.disconnect).not.toHaveBeenCalled();
    });

    it('should disconnect the user if access token is invalid or missing', async () => {
      (cookie.parse as jest.Mock).mockReturnValue({});

      await gateway.handleConnection(socketMock as Socket);

      expect(amqpConnectionMock.request).not.toHaveBeenCalled();
      expect(socketMock.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if amqp token validation returns null', async () => {
      (cookie.parse as jest.Mock).mockReturnValue({ accessToken: 'invalid_token' });
      amqpConnectionMock.request.mockResolvedValueOnce(null);

      await gateway.handleConnection(socketMock as Socket);

      expect(socketMock.disconnect).toHaveBeenCalled();
      expect(socketMock.join).not.toHaveBeenCalled();
    });

    it('should allow user to join a specific text room chat', () => {
      socketMock.data.user = { id: 'user-123' };
      gateway.handleJoinRoom(socketMock as Socket, { roomId: 'room-abc' });

      expect(socketMock.join).toHaveBeenCalledWith('room-abc');
      expect(gateway['logger'].log).toHaveBeenCalledWith('User user-123 joined text channel room-abc');
    });
    
    it('should handle user disconnect and clean up redis statuses', async () => {
        socketMock.data.user = { id: 'user-123' };
        
        await gateway.handleDisconnect(socketMock as Socket);
        
        expect(redisServiceMock.del).toHaveBeenCalledWith('user:online:user-123');
        expect(redisClientMock.set).toHaveBeenCalledWith('user:last_seen:user-123', expect.any(String));
    });
  });

  describe('Chat Operations', () => {
    it('should broadcast new message to all members requested', () => {
      const payload = {
        discussionId: 'discussion-456',
        _id: 'msg-1',
        messageSnapshot: { sender: { _id: 'user-123' } },
        membersToNotify: ['user-A', 'user-B'],
      } as any;

      gateway.handleNewMessage(payload);

      expect(serverMock.to).toHaveBeenCalledWith('user-A');
      expect(serverMock.to).toHaveBeenCalledWith('user-B');
      expect(serverMock.emit).toHaveBeenCalledWith('new_message', {
        _id: 'msg-1',
        discussionId: 'discussion-456',
        message: payload.messageSnapshot,
      });
    });

    it('should propagate typing start and stop events', () => {
      socketMock.data.user = { id: 'user-123', name: 'John', avatar: 'ava.png' };
      
      gateway.handleTypingStart(socketMock as Socket, { roomId: 'room-1' });
      expect(socketMock.to).toHaveBeenCalledWith('room-1');
      expect(socketMock.emit).toHaveBeenCalledWith('typing_start', {
        userId: 'user-123',
        name: 'John',
        avatar: 'ava.png',
      });

      gateway.handleTypingStop(socketMock as Socket, { roomId: 'room-1' });
      expect(socketMock.emit).toHaveBeenCalledWith('typing_stop', { userId: 'user-123' });
    });
  });
});
