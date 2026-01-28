import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Response, Request } from 'express';
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
  LoginResponseDto,
  Provider,
  User,
  USER_EXCHANGE,
  USER_PATTERNS,
} from '@app/contracts';
import { UserOnboardingDto } from './dto/user-onboarding.dto';
import { RmqClientService } from '@app/common';

@Injectable()
export class AuthService {
  logger: any;
  constructor(private readonly amqp: RmqClientService,
    private readonly userService: UserService
  ) { }

  private setCookies(
    accessToken: string,
    refreshToken: string,
    response: Response,
  ) {
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000 * 14,
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
      payload
    })
  }

  async verifyLocal(userId: string, code: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_LOCAL,
      payload: { userId, code }
    })
  }

  async verifyForgetPasswordCode(userId: string, code: string, password: string) {
    console.log(userId, code, password);
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD,
      payload: { userId, code, password }
    })
  }

  async verifyForgetPasswordToken(token: string, password: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_FORGOT_PASSWORD_TOKEN,
      payload: { token, password }
    })
  }

  async verifyToken(token: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_LOCAL_TOKEN,
      payload: { token }
    })
  }

  async resetCode(userId: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.RESET_CODE,
      payload: { userId }
    })
  }

  async resetVerificationCode(userId: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.RESET_VERIFICATION_CODE,
      payload: { userId }
    })
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.CHANGE_PASSWORD,
      payload: changePasswordDto
    })
  }

  async login(payload: LoginDto, response: Response) {
    try {
      const token = await this.amqp.request<LoginResponseDto>({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.LOGIN,
        payload: payload,
      });

      this.setCookies(token.accessToken, token.refreshToken, response);
      return { message: "Login successfully", isFirstLogin: token.isFirstLogin };
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
        payload: refreshToken
      })

      this.setCookies(token.accessToken, token.refreshToken, response);
      return { message: "Refresh token successfully" };
    } catch (error) {
      this.clearCookies(response);
      throw new UnauthorizedException('Invalid refresh token');
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
      payload: token
    });
  }

  async handleGoogleCallback(user: GoogleAccountDto, response: Response) {
    await this.amqp.request<LoginResponseDto>({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.GOOGLE_CALLBACK,
      payload: user
    });
    return response.redirect(`${process.env.CLIENT_URL || 'http://localhost:5000'}/dashboard`);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.FORGET_PASSWORD,
      payload: forgotPasswordDto
    });
  }

  async forgotPasswordConfirm(confirmResetPasswordDto: ConfirmResetPasswordDto) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.RESET_PASSWORD_CONFIRM,
      payload: confirmResetPasswordDto
    });
  }

  async verifyEmail(token: string) {
    return await this.amqp.request({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VERIFY_LOCAL_TOKEN,
      payload: token
    });
  }

  async getGoogleConnectionStatus(userId: string): Promise<boolean> {
    try {
      const user = await this.amqp.request<User>({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_ONE,
        payload: userId,
      });

      console.log("user in getGoogleConnectionStatus: ", user)

      if (user && user.accounts) {
        const isLinked = user.accounts.some(
          (account) => account.provider === Provider.GOOGLE
        );
        return isLinked;
      }

      return false;
    } catch (error) {
      console.error(`Error checking google status for user ${userId}:`, error);
      return false;
    }
  }

  async addSkills(userId: string, data: UserOnboardingDto) {
    return this.userService.addSkills(userId, data);
  }

  async updateSkills(userId: string, skills: string[]) {
    return this.userService.updateSkills(userId, skills);
  }

}
