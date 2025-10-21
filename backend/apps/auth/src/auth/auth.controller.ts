import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import {
  AUTH_PATTERN,
  ChangePasswordDto,
  ConfirmResetPasswordDto,
  CreateAuthDto,
  ForgotPasswordDto,
  GoogleAccountDto,
  JwtDto,
  LoginDto,
} from '@app/contracts';
import { CurrentUser } from 'apps/api-gateway/src/common/role/current-user.decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERN.REGISTER)
  register(@Payload() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @MessagePattern(AUTH_PATTERN.VALIDATE_TOKEN)
  validateToken(@Payload() token: string) {
    return this.authService.verifyToken<JwtDto>(token);
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
    return this.authService.verifyForgotPassword(
      data.userId ?? '',
      data.code ?? '',
      data.password ?? '',
    );
  }

  @MessagePattern(AUTH_PATTERN.VERIFY_FORGOT_PASSWORD_TOKEN)
  verifyForgotPasswordToken(
    @Payload() data: { token: string; password: string },
  ) {
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
  info(@CurrentUser('id') id: string) {
    return this.authService.getInfo(id);
  }

  @MessagePattern(AUTH_PATTERN.CHANGE_PASSWORD)
  changePassword(@Payload() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @MessagePattern(AUTH_PATTERN.GOOGLE_CALLBACK)
  googleCallback(@Payload() user: GoogleAccountDto) {
    console.log('GOOGLE CALLBACK');
    console.log(user);
    return this.authService.handleGoogleCallback(user);
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
