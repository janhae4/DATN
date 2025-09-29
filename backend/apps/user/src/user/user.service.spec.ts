import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { Role, UserDto } from '@app/contracts/user/user.dto';
import bcrypt from 'bcrypt';
import { PrismaService } from './prisma.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ClientConfigModule],
      providers: [UserService, PrismaService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const createDto = {
        username: 'newuser',
        password: '1234',
        name: 'New User',
        email: '001@example.com',
        phone: '0000000001'
      };
      const newUser: UserDto = await service.create(createDto);
      expect(newUser.id).toBeDefined();
      expect(newUser.username).toBe('newuser');
      expect(newUser.role).toEqual(Role.USER.toString());
      const isHashed = await bcrypt.compare('1234', newUser.password);
      expect(isHashed).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = await service.findAll({});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('should return the correct user by username', async () => {
      const user = await service.findOne({ username: 'newuser' });
      expect(user).toBeDefined();
      expect(user?.username).toBe('newuser');
    });

    it('should return undefined for non-existing user', async () => {
      const user = await service.findOne({ id: '123' });
      expect(user).toBeNull();
    });
  });

  describe('validate', () => {
    it('should return user if credentials are correct', async () => {
      const loginDto = { username: 'newuser', password: '1234' };
      const user = await service.validate(loginDto);
      expect(user).toBeDefined();
      expect(user?.username).toBe('newuser');
    });

    it('should throw error if user not found', async () => {
      const loginDto = { username: 'wrong', password: '1234' };
      expect(await service.validate(loginDto)).toBeNull();
    });

    it('should throw error if password is wrong', async () => {
      const loginDto = { username: 'newuser', password: 'wrongpass' };
      expect(await service.validate(loginDto)).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user properties', async () => {
      await service.update({ username: 'newuser' }, { username: 'admin2' });
      const user = await service.findOne({ username: 'admin2' });
      expect(user?.username).toBe('admin2');
    });
  });

  describe('remove', () => {
    it('should remove user by id', async () => {
      await service.remove({ username: 'admin2' });
      const user = await service.findOne({ username: 'admin2' });
      expect(user).toBeNull();
    });
  });
});
