import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { LoginDto } from 'apps/auth/src/auth/dto/login.dto';

@Injectable()
export class UserService {
  private users: UserDto[] = [{
    id: 1,
    username: 'admin',
    password: 'admin'
  }, {
    id: 2,
    username: 'user',
    password: 'user'
  }, {
    id: 3,
    username: 'guest',
    password: 'guest'
  }];

  create(createUserDto: CreateUserDto) {
    const user = {id: this.users.length + 1, ...createUserDto};
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
    console.log(loginDto);
    return this.users.find(user => user.username === loginDto.username && user.password === loginDto.password);
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.users.map(user => user.id === id ? {...user, ...updateUserDto} : user);
  }

  remove(id: number) {
    return this.users.map(user => user.id !== id);
  }
}
