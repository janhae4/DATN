import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices'; // Payload vẫn được import nhưng không được dùng
import { AuthService } from './auth.service';
import {
  AUTH_EXCHANGE,
  AUTH_PATTERN,
  ChangePasswordDto,
  ConfirmResetPasswordDto,
  CreateAuthDto,
  ForgotPasswordDto,
  GoogleAccountDto,
  JwtDto,
  LoginDto,
} from '@app/contracts';
import { MessageHandlerErrorBehavior, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { RabbitPayload } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.decorators';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.REGISTER,
    queue: AUTH_PATTERN.REGISTER
  })
  register(createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
    queue: AUTH_PATTERN.VALIDATE_TOKEN
  })
  validateToken(token: string) {
    return this.authService.verifyToken<JwtDto>(token);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.VERIFY_LOCAL,
    queue: AUTH_PATTERN.VERIFY_LOCAL
  })
  verifyLocal(data: { userId: string; code: string }) {
    return this.authService.verifyLocal(data.userId, data.code);
  }


  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.VERIFY_LOCAL_TOKEN,
    queue: AUTH_PATTERN.VERIFY_LOCAL_TOKEN
  })
  verifyLocalToken(token: string) {
    return this.authService.verifyLocalToken(token);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD,
    queue: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD
  })
  verifyForgotPassword(data: ConfirmResetPasswordDto) {
    return this.authService.verifyForgotPassword(
      data.userId ?? '',
      data.code ?? '',
      data.password ?? '',
    );
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD_TOKEN,
    queue: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD_TOKEN
  })
  verifyForgotPasswordToken(
    data: { token: string; password: string },
  ) {
    const { token, password } = data;
    return this.authService.verifyForgotPasswordToken(token, password);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.RESET_CODE,
    queue: AUTH_PATTERN.RESET_CODE
  })
  resetCode(userId: string) {
    return this.authService.resetCode(userId);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.RESET_VERIFICATION_CODE,
    queue: AUTH_PATTERN.RESET_VERIFICATION_CODE, // Giữ nguyên (đã đúng)
  })
  resetVerificationCode(userId: string) {
    return this.authService.resetVerificationCode(userId);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.LOGIN,
    queue: AUTH_PATTERN.LOGIN,
  })
  async login(@RabbitPayload() loginDto: LoginDto) {
    console.log(loginDto);
    return await this.authService.login(loginDto);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.INFO,
    queue: AUTH_PATTERN.INFO
  })
  info(id: string) {
    return this.authService.getInfo(id);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.CHANGE_PASSWORD,
    queue: AUTH_PATTERN.CHANGE_PASSWORD
  })
  changePassword(changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(changePasswordDto);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.GOOGLE_CALLBACK,
    queue: AUTH_PATTERN.GOOGLE_CALLBACK
  })
  googleCallback(user: GoogleAccountDto) {
    console.log('GOOGLE CALLBACK');
    console.log(user);
    return this.authService.handleGoogleCallback(user);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.REFRESH,
    queue: AUTH_PATTERN.REFRESH
  })
  async getRefreshToken(token: string) {
    console.log(token);
    return await this.authService.refresh(token);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.LOGOUT,
    queue: AUTH_PATTERN.LOGOUT
  })
  async logout(@RabbitPayload() refreshToken: string) {
    return await this.authService.logout(refreshToken);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.LOGOUT_ALL,
    queue: AUTH_PATTERN.LOGOUT_ALL
  })
  logoutAll(refreshToken: string) {
    return this.authService.logoutAll(refreshToken);
  }

  @RabbitRPC({
    exchange: AUTH_EXCHANGE,
    routingKey: AUTH_PATTERN.FORGET_PASSWORD,
    queue: AUTH_PATTERN.FORGET_PASSWORD
  })
  async forgetPassword(payload: ForgotPasswordDto) {
    return await this.authService.forgetPassword(payload);
  }
}