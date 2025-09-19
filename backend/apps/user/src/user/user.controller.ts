import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from 'apps/auth/src/auth/dto/login.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.create')
  create(@Payload() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @MessagePattern('user.findAll')
  findAll() {
    return this.userService.findAll();
  }

  @MessagePattern('user.findOne')
  findOne(@Payload() id: number) {
    return this.userService.findOne(id);
  }

  @MessagePattern('user.validate')
  validate(@Payload() loginDto: LoginDto) {
    console.log(loginDto);
    const user = this.userService.validate(loginDto);
    console.log(user);
    return user;
  }

  @MessagePattern('user.update')
  update(@Payload() updateUserDto: UpdateUserDto) {
    return this.userService.update(updateUserDto.id, updateUserDto);
  }

  @MessagePattern('user.remove')
  remove(@Payload() id: number) {
    return this.userService.remove(id);
  }
}
