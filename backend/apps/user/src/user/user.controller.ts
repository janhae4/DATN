import { Controller } from '@nestjs/common';
import { RabbitPayload, RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { UserService } from './user.service';
import {
  Account,
  ChangePasswordDto,
  CreateAuthLocalDto,
  CreateAuthOAuthDto,
  EVENTS,
  EVENTS_EXCHANGE,
  EVENTS_USER_QUEUE,
  FindUserDto,
  LoginDto,
  Provider,
  User,
  USER_EXCHANGE,
  USER_PATTERNS,
} from '@app/contracts';
import { Payload } from '@nestjs/microservices';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LOGIN,
    queue: EVENTS_USER_QUEUE,
    queueOptions: {
      durable: true,
    },
  })
  handleLogin(@Payload() payload: Partial<User>) {
    this.userService.update(payload.id ?? '', {
      lastLogin: new Date(),
      isActive: true,
    });
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.CREATE_LOCAL,
    queue: USER_PATTERNS.CREATE_LOCAL,
  })
  create(createUserDto: CreateAuthLocalDto) {
    return this.userService.createLocal(createUserDto);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.CREATE_OAUTH,
    queue: USER_PATTERNS.CREATE_OAUTH,
  })
  createOAuth(data: CreateAuthOAuthDto) {
    return this.userService.createOAuth(data);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.CREATE_ACCOUNT,
    queue: USER_PATTERNS.CREATE_ACCOUNT,
  })
  createAccount(partial: Partial<Account>) {
    return this.userService.createAccount(partial);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.VERIFY_LOCAL,
    queue: USER_PATTERNS.VERIFY_LOCAL,
  })
  verifyLocal(data: { userId: string; code: string }) {
    return this.userService.verifyLocal(data.userId, data.code);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.VERIFY_FORGET_PASSWORD,
    queue: USER_PATTERNS.VERIFY_FORGET_PASSWORD,
  })
  verifyForgotPassword(data: { userId: string; code: string; password: string }) {
    return this.userService.verifyForgotPassword(
      data.userId,
      data.code,
      data.password,
    );
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.RESET_CODE,
    queue: USER_PATTERNS.RESET_CODE,
  })
  resetCode(data: { userId: string; typeCode: 'verify' | 'reset' }) {
    const { userId, typeCode } = data;
    console.log(data);
    return this.userService.resetCode(userId, typeCode);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.RESET_PASSWORD,
    queue: USER_PATTERNS.RESET_PASSWORD,
  })
  resetPassword(email: string) {
    console.log(email);
    return this.userService.resetPassword(email);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_ALL,
    queue: USER_PATTERNS.FIND_ALL,
  })
  findAll() {
    return this.userService.findAll({});
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_ONE,
    queue: USER_PATTERNS.FIND_ONE,
  })
  findOne(id: string) {
    return this.userService.findOne(id);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_ONE_WITH_PASSWORD,
    queue: USER_PATTERNS.FIND_ONE_WITH_PASSWORD,
  })
  async findOneWithPassword(@RabbitPayload('id') id: string) {
    return await this.userService.findOneWithPassword(id);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_ONE_GOOGLE_BY_EMAIL,
    queue: USER_PATTERNS.FIND_ONE_GOOGLE_BY_EMAIL,
  })
  async findOneGoogle(email: string) {
    return await this.userService.findOneGoogle(email);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_ONE_BY_EMAIL,
    queue: USER_PATTERNS.FIND_ONE_BY_EMAIL,
  })
  async findOneByEmail(email: string) {
    return await this.userService.findOneByEmail(email);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_ONE_OAUTH,
    queue: USER_PATTERNS.FIND_ONE_OAUTH,
  })
  async findOneOAuth(data: { provider: Provider; providerId: string }) {
    return await this.userService.findOneOAuth(data.provider, data.providerId);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
    queue: USER_PATTERNS.FIND_MANY_BY_IDs,
  })
  async findManyByIds(ids: string[]) {
    return await this.userService.findManyByIds(ids);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.VALIDATE,
    queue: USER_PATTERNS.VALIDATE,
  })
  async validate(loginDto: LoginDto) {
    return await this.userService.validate(loginDto);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.UPDATE_PASSWORD,
    queue: USER_PATTERNS.UPDATE_PASSWORD,
  })
  async updatePassword(updatePasswordDto: ChangePasswordDto) {
    return await this.userService.updatePassword(
      updatePasswordDto.id ?? '',
      updatePasswordDto.oldPassword,
      updatePasswordDto.newPassword,
    );
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.UPDATE,
    queue: USER_PATTERNS.UPDATE,
  })
  update(data: { id: string; updateUser: Partial<User> }) {
    return this.userService.update(data.id, data.updateUser);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.REMOVE,
    queue: USER_PATTERNS.REMOVE,
  })
  remove(@RabbitPayload('id') id: string) {
    return this.userService.remove(id);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FIND_MANY_BY_NAME,
    queue: USER_PATTERNS.FIND_MANY_BY_NAME,
  })
  findByName(payload: FindUserDto) {
    return this.userService.findByName(payload.key, payload.options, payload.requesterId);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.FOLLOW,
    queue: USER_PATTERNS.FOLLOW,
  })
  follow(requesterId: string, followingId: string) {
    return this.userService.follow(requesterId, followingId);
  }

  @RabbitRPC({
    exchange: USER_EXCHANGE,
    routingKey: USER_PATTERNS.UNFOLLOW,
    queue: USER_PATTERNS.UNFOLLOW,
  })
  unfollow(requesterId: string, followingId: string) {
    return this.userService.unfollow(requesterId, followingId);
  }
}