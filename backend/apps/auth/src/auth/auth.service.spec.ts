import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthCacheService, UserCacheService } from '@app/redis-service';
import { RmqClientService } from '@app/common/rabbitmq/rmq.service';
import { USER_EXCHANGE, USER_PATTERNS, EVENTS_EXCHANGE, EVENTS, User, UnauthorizedException, Role } from '@app/contracts';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_token'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('crypto', () => {
    const originalModule = jest.requireActual('crypto');
    return {
        ...originalModule,
        randomUUID: jest.fn().mockReturnValue('mocked-session-id'),
    };
});

describe('AuthService', () => {
  let service: AuthService;
  let amqpMock: jest.Mocked<RmqClientService>;
  let jwtServiceMock: jest.Mocked<JwtService>;
  let authCacheServiceMock: jest.Mocked<AuthCacheService>;
  let userCacheServiceMock: jest.Mocked<UserCacheService>;

  beforeEach(async () => {
    amqpMock = {
      request: jest.fn(),
      publish: jest.fn(),
    } as any;

    jwtServiceMock = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as any;

    authCacheServiceMock = {
      storeRefreshToken: jest.fn(),
      getStoredRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      setLockKey: jest.fn(),
      deleteLockKey: jest.fn(),
      storeGoogleToken: jest.fn(),
    } as any;

    userCacheServiceMock = {
      cacheUserProfile: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: RmqClientService, useValue: amqpMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: AuthCacheService, useValue: authCacheServiceMock },
        { provide: UserCacheService, useValue: userCacheServiceMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Mute console logs during tests
    jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(service['logger'], 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = { username: 'testuser', password: 'password123' };
    const mockUser = new User();
    mockUser.id = 'user-123';
    mockUser.role = Role.USER;
    mockUser.lastLogin = null as any;

    it('should authenticate user, generate tokens and notify login event', async () => {
      // Setup amqp.request to return user when validating credentials
      amqpMock.request.mockResolvedValueOnce(mockUser);
      
      // Setup JWT signing
      jwtServiceMock.signAsync
        .mockResolvedValueOnce('mock_access_token')
        .mockResolvedValueOnce('mock_refresh_token');

      const result = await service.login(loginDto);

      // Verify request to user microservice to validate credentials
      expect(amqpMock.request).toHaveBeenCalledWith({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.VALIDATE,
        payload: loginDto,
      });

      // Verify token generation side effects
      expect(jwtServiceMock.signAsync).toHaveBeenCalledTimes(2);
      expect(authCacheServiceMock.storeRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'mocked-session-id',
        'hashed_token',
        1209600 // 14 days
      );
      expect(userCacheServiceMock.cacheUserProfile).toHaveBeenCalledWith(mockUser);

      // Verify login event broadcast
      expect(amqpMock.publish).toHaveBeenCalledWith(EVENTS_EXCHANGE, EVENTS.LOGIN, mockUser);

      // Verify result structure (isFirstLogin true since lastLogin was null)
      expect(result).toEqual({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        isFirstLogin: true,
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      amqpMock.request.mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(amqpMock.request).toHaveBeenCalledTimes(1);
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
      expect(amqpMock.publish).not.toHaveBeenCalled();
    });
  });

  describe('_generateTokensAndSession', () => {
    const mockUser = new User();
    mockUser.id = 'user-123';
    mockUser.role = Role.USER;

    it('should generate new tokens and store session properly', async () => {
      jwtServiceMock.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      // Use the protected method for internal logic testing using any 
      const tokens = await (service as any)._generateTokensAndSession(mockUser);

      expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
        1,
        { id: mockUser.id, role: mockUser.role },
        { expiresIn: 86400 } // 24h
      );

      expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
        2,
        { id: mockUser.id, role: mockUser.role, sessionId: 'mocked-session-id' },
        { expiresIn: 1209600 } // 14 days
      );

      expect(authCacheServiceMock.storeRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        'mocked-session-id',
        'hashed_token',
        1209600
      );

      expect(tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('handleLinking', () => {
    const mockUser = { id: 'user-123', role: Role.USER };
    const mockData = {
      accessToken: 'google-access-token',
      refreshToken: 'google-refresh-token',
      provider: 'GOOGLE',
      providerId: 'google-123',
      email: 'test@gmail.com',
      name: 'Test Google',
      avatar: 'google.png',
      linkedUser: 'valid_jwt_token',
    } as any;

    it('should throw UnauthorizedException if no valid user session is provided', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValueOnce(new Error('Invalid token'));

      await expect(
        (service as any).handleLinking(mockData, null)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if Google account is already linked', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValueOnce(mockUser);
      
      const existingAccount = { id: 'account-1' } as any;

      await expect(
        (service as any).handleLinking(mockData, existingAccount)
      ).rejects.toThrow('Google account already linked');
    });

    it('should successfully link account and return tokens', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValueOnce(mockUser);
      
      // Setup _generateTokensAndSession's internal JWT signs
      jwtServiceMock.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const result = await (service as any).handleLinking(mockData, null);

      expect(authCacheServiceMock.storeGoogleToken).toHaveBeenCalledWith(
        mockUser.id,
        'google-access-token',
        'google-refresh-token'
      );

      expect(amqpMock.request).toHaveBeenCalledWith({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.CREATE_ACCOUNT,
        payload: {
          user: { id: mockUser.id },
          provider: 'GOOGLE',
          providerId: 'google-123',
          email: 'test@gmail.com',
          name: 'Test Google',
          avatar: 'google.png',
        },
      });

      expect(userCacheServiceMock.delete).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        message: 'Google account linked successfully',
      });
    });
  });
});
