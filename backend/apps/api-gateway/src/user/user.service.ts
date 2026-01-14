import { Injectable } from '@nestjs/common';
import {
  CreateUserDto,
  FindUserDto,
  LoginDto,
  UpdateUserDto,
  USER_EXCHANGE,
  USER_PATTERNS,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { UserOnboardingDto } from '../auth/dto/user-onboarding.dto';
import { RmqClientService } from '@app/common';

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: RmqClientService) { }
  create(createUserDto: CreateUserDto) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.CREATE_LOCAL,
      payload: createUserDto,
    });
  }

  findAll() {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ALL,
      payload: {},
    });
  }

  findOne(id: string) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE,
      payload: id,
    });
  }

  findByName(findUser: FindUserDto) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_MANY_BY_NAME,
      payload: findUser,
    });
  }

  validate(loginDto: LoginDto) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.VALIDATE,
      payload: loginDto,
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.UPDATE,
      payload: { id, updateUser: updateUserDto },
    });
  }

  follow(requesterId: string, followingId: string) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FOLLOW,
      payload: { requesterId, followingId },
    });
  }

  unfollow(requesterId: string, followingId: string) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.UNFOLLOW,
      payload: { requesterId, followingId },
    });
  }

  remove(id: string) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.REMOVE,
      payload: id,
    });
  }

  ban(id: string) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.BAN,
      payload: id,
    });
  }

  unban(id: string) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.UNBAN,
      payload: id,
    });
  }

  addSkills(userId: string, data: UserOnboardingDto) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.ADD_SKILLS,
      payload: { userId, ...data },
    });
  }

  updateSkills(userId: string, skills: string[]) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.UPDATE_SKILLS,
      payload: { userId, skills },
    });
  }
}
