import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Response, Request } from 'express';
import {
  ACCESS_TTL,
  AUTH_EXCHANGE,
  AUTH_PATTERN,
  AUTH_QUEUE,
  ChangePasswordDto,
  ConfirmResetPasswordDto,
  CreateAuthDto,
  ForgotPasswordDto,
  GoogleAccountDto,
  JwtDto,
  LoginDto,
  LoginResponseDto,
  REFRESH_TTL,
  RPC_TIMEOUT,
  User,
  USER_EXCHANGE,
  USER_PATTERNS,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class AuthService {
  constructor(private readonly amqp: AmqpConnection, private readonly userService: UserService) { }

  private setCookies(
    accessToken: string,
    refreshToken: string,
    response: Response,
  ) {
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: ACCESS_TTL,
    });
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: REFRESH_TTL,
    });
  }

  private clearCookies(response: Response) {
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');
  }

  findAllUser() {
    this.userService.findAll();
  }

  async register(payload: CreateAuthDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.REGISTER,
      payload,
      timeout: RPC_TIMEOUT
    });
  }

  async verifyLocal(userId: string, code: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_LOCAL,
      payload: { userId, code },
      timeout: RPC_TIMEOUT
    })
  }

  async verifyForgetPasswordCode(userId: string, code: string, password: string) {
    console.log(userId, code, password);
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD,
      payload: { userId, code, password },
      timeout: RPC_TIMEOUT
    })
  }

  async verifyForgetPasswordToken(token: string, password: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD_TOKEN,
      payload: { token, password },
      timeout: RPC_TIMEOUT
    })
  }

  async verifyToken(token: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_LOCAL_TOKEN,
      payload: { token },
      timeout: RPC_TIMEOUT
    })
  }

  async resetCode(userId: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.RESET_CODE,
      payload: { userId },
      timeout: RPC_TIMEOUT
    })
  }

  async resetVerificationCode(userId: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.RESET_VERIFICATION_CODE,
      payload: { userId },
      timeout: RPC_TIMEOUT
    })
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.CHANGE_PASSWORD,
      payload: changePasswordDto,
      timeout: RPC_TIMEOUT
    })
  }

  async login(payload: LoginDto, response: Response) {
    try {
      const token = await this.amqp.request<LoginResponseDto>({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.LOGIN,
        payload: payload,
        timeout: RPC_TIMEOUT
      })

      this.setCookies(token.accessToken, token.refreshToken, response);
      return "Login successfully";
    } catch (error) {
      this.clearCookies(response);
      throw error;
    }
  }

  getInfo(id: string) {
    return this.amqp.request<Partial<User>>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE,
      payload: id
    });
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.refreshToken as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');
    try {
      const token: LoginResponseDto = await this.amqp.request({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.REFRESH,
        payload: refreshToken,
        timeout: RPC_TIMEOUT
      });
      this.setCookies(token.accessToken, token.refreshToken, response);
      return token;
    } catch (error) {
      this.clearCookies(response);
      throw error;
    }
  }

  logout(request: Request, response: Response) {
    console.log(request.cookies);
    const refreshToken = request.cookies.refreshToken as string | undefined;
    this.amqp.publish(AUTH_EXCHANGE, AUTH_PATTERN.LOGOUT, refreshToken);
    this.clearCookies(response);
    return { message: 'Logout successfully' };
  }

  logoutAll(request: Request, response: Response) {
    const refreshToken = request.cookies.refreshToken as string | undefined;
    this.clearCookies(response);
    this.amqp.publish(AUTH_EXCHANGE, AUTH_PATTERN.LOGOUT_ALL, refreshToken);
  }

  async validateToken(token: string): Promise<JwtDto> {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
      payload: token,
      timeout: RPC_TIMEOUT
    });
  }

  async handleGoogleCallback(user: GoogleAccountDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.GOOGLE_CALLBACK,
      payload: user,
      timeout: RPC_TIMEOUT
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.FORGET_PASSWORD,
      payload: forgotPasswordDto,
      timeout: RPC_TIMEOUT
    });
  }

  async forgotPasswordConfirm(confirmResetPasswordDto: ConfirmResetPasswordDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.RESET_PASSWORD_CONFIRM,
      payload: confirmResetPasswordDto,
      timeout: RPC_TIMEOUT
    });
  }

  async verifyEmail(token: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_EMAIL,
      payload: { token },
      timeout: RPC_TIMEOUT
    });
  }
}
