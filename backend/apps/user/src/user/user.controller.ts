import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth.dto';
import { CreateAuthLocalDto } from '@app/contracts/auth/create-auth-local.dto';
import { User } from './entity/user.entity';
import { Provider } from '@app/contracts/user/account.dto';
import { Account } from './entity/account.entity';
import { ChangePasswordDto } from '@app/contracts/auth/reset-password.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(USER_PATTERNS.CREATE_LOCAL)
  create(@Payload() createUserDto: CreateAuthLocalDto) {
    return this.userService.createLocal(createUserDto);
  }

  @MessagePattern(USER_PATTERNS.CREATE_OAUTH)
  createOAuth(@Payload() data: CreateAuthOAuthDto) {
    return this.userService.createOAuth(data);
  }

  @MessagePattern(USER_PATTERNS.CREATE_ACCOUNT)
  createAccount(@Payload() partial: Partial<Account>) {
    return this.userService.createAccount(partial);
  }

  @MessagePattern(USER_PATTERNS.VERIFY_LOCAL)
  verifyLocal(@Payload() data: { userId: string; code: string }) {
    return this.userService.verifyLocal(data.userId, data.code);
  }

  @MessagePattern(USER_PATTERNS.VERIFY_FORGET_PASSWORD)
  verifyForgotPassword(@Payload() data: { userId: string; code: string, password: string }) {
    return this.userService.verifyForgotPassword(data.userId, data.code, data.password);
  }

  @MessagePattern(USER_PATTERNS.RESET_CODE)
  resetCode(@Payload() data: { userId: string; typeCode: 'verify' | 'reset' }) {
    const { userId, typeCode } = data;
    console.log(data);
    return this.userService.resetCode(userId, typeCode);
  }

  @MessagePattern(USER_PATTERNS.RESET_PASSWORD)
  resetPassword(@Payload() email: string) {
    console.log(email)
    return this.userService.resetPassword(email);
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

  @MessagePattern(USER_PATTERNS.FIND_ONE_OAUTH)
  async findOneOAuth(
    @Payload() data: { provider: Provider; providerId: string },
  ) {
    return await this.userService.findOneOAuth(data.provider, data.providerId);
  }

  @MessagePattern(USER_PATTERNS.VALIDATE)
  async validate(@Payload() loginDto: LoginDto) {
    return await this.userService.validate(loginDto);
  }

  @MessagePattern(USER_PATTERNS.UPDATE_PASSWORD)
  async updatePassword(@Payload() updatePasswordDto: ChangePasswordDto) {
    return await this.userService.updatePassword(
      updatePasswordDto.id ?? "",
      updatePasswordDto.oldPassword,
      updatePasswordDto.newPassword
    );
  }

  @MessagePattern(USER_PATTERNS.UPDATE)
  update(@Payload() data: { id: string; updateUser: Partial<User> }) {
    return this.userService.update(data.id, data.updateUser);
  }

  @MessagePattern(USER_PATTERNS.REMOVE)
  remove(@Payload() id: string) {
    return this.userService.remove(id);
  }
}
