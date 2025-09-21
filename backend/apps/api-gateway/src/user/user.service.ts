import { Inject, Injectable } from '@nestjs/common';

import { ClientProxy } from '@nestjs/microservices';
import { LoginDto } from '@app/contracts/auth/login.dto';
import { USER_CLIENT } from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { CreateUserDto } from '@app/contracts/user/create-user.dto';
import { UpdateUserDto } from '@app/contracts/user/update-user.dto';

@Injectable()
export class UserService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy) { }
  async create(createUserDto: CreateUserDto) {
    return this.userClient.send(USER_PATTERNS.CREATE, createUserDto);
  }

  async findAll() {
    return this.userClient.send(USER_PATTERNS.FIND_ALL, {});
  }

  async findOne(id: number) {
    return this.userClient.send(USER_PATTERNS.FIND_ONE, id);
  }

  async validate(loginDto: LoginDto) {
    return this.userClient.send(USER_PATTERNS.VALIDATE, loginDto);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return this.userClient.send(USER_PATTERNS.UPDATE, { updateUserDto, id });
  }

  async remove(id: number) {
    return this.userClient.send(USER_PATTERNS.REMOVE, id);
  }
}
