import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { CreateAuthLocalDto } from '@app/contracts/auth/create-auth-local';
import { UpdatePasswordDto } from '@app/contracts/user/update-password';
import { User } from './entity/user.entity';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(USER_PATTERNS.CREATE_LOCAL)
  create(@Payload() createUserDto: CreateAuthLocalDto) {
    return this.userService.registerLocal(createUserDto);
  }

  @MessagePattern(USER_PATTERNS.CREATE_OAUTH)
  createOAuth(@Payload() data: CreateAuthOAuthDto) {
    return this.userService.createOAuth(data);
  }

  @MessagePattern(USER_PATTERNS.FIND_ALL)
  findAll() {
    return this.userService.findAll({});
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE)
  async findOne(@Payload() id: string) {
    return await this.userService.findOne(id);
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE_WITH_PASSWORD)
  async findOneWithPassword(@Payload() id: string) {
    return await this.userService.findOneWithPassword(id);
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE_GOOGLE_BY_EMAIL)
  async findOneGoogle(@Payload() email: string) {
    return await this.userService.findOneGoogle(email);
  }

  @MessagePattern(USER_PATTERNS.FIND_ONE_BY_EMAIL)
  async findOneByEmail(@Payload() email: string) {
    return await this.userService.findOneByEmail(email);
  }

  @MessagePattern(USER_PATTERNS.VALIDATE)
  async validate(@Payload() loginDto: LoginDto) {
    console.log(loginDto);
    const user = await this.userService.validate(loginDto);
    console.log(user);
    return user;  
  }

  @MessagePattern(USER_PATTERNS.UPDATE_PASSWORD)
  updatePassword(@Payload() updatePasswordDto: UpdatePasswordDto) {
    return this.userService.updatePassword(
      updatePasswordDto.id,
      updatePasswordDto.password,
    );
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  update(@Payload() data: { id: string; updateUser: Partial<User> }) {
    return this.userService.update(data.id, data.updateUser);
  }

  @MessagePattern(USER_PATTERNS.VERIFY_EMAIL)
  async verifyEmail(@Payload() token: string) {
    return await this.userService.verifyEmail(token);
  }
  @MessagePattern(USER_PATTERNS.SEND_VERIFICATION_EMAIL)
  async sendVerificationEmail(@Payload() data: { userId: string; email: string; verificationToken: string }) {
    // This will be handled by the Gmail service via microservice communication
    return { message: 'Verification email queued for sending' };
  }

  @MessagePattern(USER_PATTERNS.REMOVE)
  remove(@Payload() id: string) {
    return this.userService.remove(id);
  }
}
