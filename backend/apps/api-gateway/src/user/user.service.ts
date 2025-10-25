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

@Injectable()
export class UserService {
  constructor(private readonly amqpConnection: AmqpConnection) { }
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

  remove(id: string) {
    return this.amqpConnection.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.REMOVE,
      payload: id,
    });
  }
}