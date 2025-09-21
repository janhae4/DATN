import { Injectable } from '@nestjs/common';

import bcrypt from 'bcrypt';
import { LoginDto } from '@app/contracts/auth/login.dto';
import { UserDto } from '@app/contracts/user/user.dto';
import { CreateUserDto } from '@app/contracts/user/create-user.dto';
import { UpdateUserDto } from '@app/contracts/user/update-user.dto';
import { Role } from 'apps/api-gateway/enums/role.enum';

@Injectable()
export class UserService {
  private users: UserDto[] = [{
    id: 1,
    username: 'admin',
    password: 'admin',
    role: [Role.Admin]
  }, {
    id: 2,
    username: 'user',
    password: 'user',
    role: [Role.User]
  }, {
    id: 3,
    username: 'guest',
    password: 'guest',
    role: [Role.User]
  }];

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = {
      id: this.users.length + 1,
      password: hashedPassword,
      username: createUserDto.username,
      role: [Role.User]
    };
    this.users.push(user);
    return user;
  }

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find(user => user.id === id);
  }

  async validate(loginDto: LoginDto) {
    const user = this.users.find(u => u.username === loginDto.username);
    if (!user) throw new Error("Invalid Credentials", { cause: 401 });
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    // if (!isPasswordValid) throw new Error("Invalid Credentials");
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.users.map(user => user.id === id ? { ...user, ...updateUserDto } : user);
  }

  remove(id: number) {
    return this.users.map(user => user.id !== id);
  }
}
