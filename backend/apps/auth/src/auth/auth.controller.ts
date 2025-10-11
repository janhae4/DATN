import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { UserDto } from '@app/contracts/user/user.dto';
import { GoogleAccountDto } from '@app/contracts/auth/account-google.dto';
import { ForgotPasswordDto } from '@app/contracts/auth/forgot-password.dto';
import { ConfirmResetPasswordDto } from '@app/contracts/auth/confirm-reset-password.dto';
import { ChangePasswordDto } from '@app/contracts/auth/reset-password.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern(AUTH_PATTERN.REGISTER)
  register(@Payload() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @MessagePattern(AUTH_PATTERN.VERIFY_LOCAL)
  verifyLocal(@Payload() data: { userId: string; code: string }) {
    return this.authService.verifyLocal(data.userId, data.code);
  }

  @MessagePattern(AUTH_PATTERN.VERIFY_LOCAL_TOKEN)
  verifyLocalToken(@Payload() token: string) {
    return this.authService.verifyLocalToken(token);
  }

  @MessagePattern(AUTH_PATTERN.VERIFY_FORGOT_PASSWORD)
  verifyForgotPassword(@Payload() data: ConfirmResetPasswordDto) {
    console.log(data);
    return this.authService.verifyForgotPassword(data.userId ?? '', data.code ?? '', data.password ?? '');
  }

  @MessagePattern(AUTH_PATTERN.VERIFY_FORGOT_PASSWORD_TOKEN)
  verifyForgotPasswordToken(@Payload() data: { token: string; password: string }) {
    const { token, password } = data;
    return this.authService.verifyForgotPasswordToken(token, password);
  }

  @MessagePattern(AUTH_PATTERN.RESET_CODE)
  resetCode(@Payload() userId: string) {
    return this.authService.resetCode(userId);
  }

  @MessagePattern(AUTH_PATTERN.RESET_VERIFICATION_CODE)
  resetVerificationCode(@Payload() userId: string) {
    return this.authService.resetVerificationCode(userId);
  }

  @MessagePattern(AUTH_PATTERN.LOGIN)
  async login(@Payload() loginDto: LoginDto) {
    console.log(loginDto);
    return await this.authService.login(loginDto);
  }

  @MessagePattern(AUTH_PATTERN.INFO)
  info(@Payload() id: string) {
    return this.authService.getInfo(id);
  }

  @MessagePattern(AUTH_PATTERN.CHANGE_PASSWORD)
  async changePassword(
    @Payload() changePasswordDto: ChangePasswordDto,
  ): Promise<UserDto> {
    return await this.authService.changePassword(changePasswordDto);
  }

  @MessagePattern(AUTH_PATTERN.GOOGLE_CALLBACK)
  googleCallback(@Payload() user: GoogleAccountDto) {
    console.log('GOOGLE CALLBACK');
    console.log(user);
    return this.authService.handleGoogleCallback(user);
  }

  @MessagePattern(AUTH_PATTERN.VALIDATE_TOKEN)
  async validateToken(@Payload() token: string) {
    return await this.authService.verifyToken(token);
  }

  @MessagePattern(AUTH_PATTERN.REFRESH)
  async getRefreshToken(@Payload() token: string) {
    console.log('REFRESH TOKEN');
    return await this.authService.refresh(token);
  }

  @MessagePattern(AUTH_PATTERN.LOGOUT)
  async logout(@Payload() refreshToken: string) {
    return await this.authService.logout(refreshToken);
  }

  @MessagePattern(AUTH_PATTERN.LOGOUT_ALL)
  logoutAll(@Payload() refreshToken: string) {
    return this.authService.logoutAll(refreshToken);
  }

  @MessagePattern(AUTH_PATTERN.FORGET_PASSWORD)
  async forgetPassword(@Payload() payload: ForgotPasswordDto) {
    return await this.authService.forgetPassword(payload);
  }
}
