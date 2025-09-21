import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from '@app/contracts/user/create-user.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { UpdateUserDto } from '@app/contracts/user/update-user.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern('user.create')
  create(@Payload() createUserDto: CreateUserDto) {
    console.log(createUserDto);
    return this.userService.create(createUserDto);
  }

  @MessagePattern('user.findAll')
  findAll() {
    return this.userService.findAll({});
  }

  @MessagePattern('user.findOne')
  findOne(@Payload() id: string) {
    return this.userService.findOne({ id });
  }

  @MessagePattern('user.validate')
  validate(@Payload() loginDto: LoginDto) {
    console.log(loginDto);
    const user = this.userService.validate(loginDto);
    console.log(user);
    return user;
  }

  @MessagePattern('user.update')
  update(@Payload() id: string, @Payload() updateUserDto: UpdateUserDto) {
    return this.userService.update({ id }, updateUserDto);
  }

  @MessagePattern('user.remove')
  remove(@Payload() id: string) {
    return this.userService.remove({ id });
  }
}
