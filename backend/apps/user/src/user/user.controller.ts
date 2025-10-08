import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { CreateUserDto } from '@app/contracts/user/create-user.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { UpdateUserDto } from '@app/contracts/user/update-user.dto';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(USER_PATTERNS.CREATE_LOCAL)
  create(@Payload() createUserDto: CreateUserDto) {
    return this.userService.registerLocal(createUserDto);
  }

  @MessagePattern(USER_PATTERNS.CREATE_OAUTH)
  createOAuth(@Payload() data: CreateAuthOAuthDto) {
    return this.userService.loginOAuth(data);
  }

  @MessagePattern(USER_PATTERNS.FIND_ALL)
  findAll() {
    return this.userService.findAll({});
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE)
  async findOne(@Payload() id: string) {
    return await this.userService.findOne(id);
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE_GOOGLE)
  async findOneGoogle(@Payload() id: string) {
    return await this.userService.findOneGoogle(id);
  }

  @MessagePattern(USER_PATTERNS.VALIDATE)
  validate(@Payload() loginDto: LoginDto) {
    console.log(loginDto);
    const user = this.userService.validate(loginDto);
    console.log(user);
    return user;
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  update(@Payload() id: string, @Payload() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @MessagePattern(USER_PATTERNS.REMOVE)
  remove(@Payload() id: string) {
    return this.userService.remove(id);
  }
}
