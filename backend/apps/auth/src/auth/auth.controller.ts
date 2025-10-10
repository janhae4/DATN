import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { ForgotPasswordDto } from '@app/contracts/auth/forgot-password.dto';
import { ConfirmResetPasswordDto } from '@app/contracts/auth/confirm-reset-password.dto';
import { ResetPasswordDto } from '@app/contracts/auth/reset-password.dto';
import { UserDto } from '@app/contracts/user/user.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERN.REGISTER)
  register(@Payload() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
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

  @MessagePattern(AUTH_PATTERN.RESET_PASSWORD)
  async resetPassword(
    @Payload() resetPasswordDto: ResetPasswordDto,
  ): Promise<UserDto> {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @MessagePattern(AUTH_PATTERN.GOOGLE_CALLBACK)
  googleCallback(@Payload() user: CreateAuthOAuthDto) {
    console.log('GOOGLE CALLBACK');
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

  @MessagePattern(AUTH_PATTERN.RESET_PASSWORD_CONFIRM)
  async resetPasswordConfirm(@Payload() confirmResetPasswordDto: ConfirmResetPasswordDto) {
    return await this.authService.resetPasswordConfirm(confirmResetPasswordDto);
  }
}
