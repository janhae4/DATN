import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateUserDto,
  FindUserDto,
  LoginDto,
  UpdateUserDto,
  USER_CLIENT,
  USER_PATTERNS,
} from '@app/contracts';

@Injectable()
export class UserService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) {}
  create(createUserDto: CreateUserDto) {
    return this.userClient.send(USER_PATTERNS.CREATE_LOCAL, createUserDto);
  }

  findAll() {
    return this.userClient.send(USER_PATTERNS.FIND_ALL, {});
  }

  findOne(id: string) {
    return this.userClient.send(USER_PATTERNS.FIND_ONE, id);
  }

  findByName(findUser: FindUserDto) {
    return this.userClient.send(USER_PATTERNS.FIND_MANY_BY_NAME, findUser);
  }

  validate(loginDto: LoginDto) {
    return this.userClient.send(USER_PATTERNS.VALIDATE, loginDto);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userClient.send(USER_PATTERNS.UPDATE, { updateUserDto, id });
  }

  remove(id: number) {
    return this.userClient.send(USER_PATTERNS.REMOVE, id);
  }
}
