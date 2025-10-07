import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AUTH_PATTERN.REGISTER)
  register(@Payload() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @MessagePattern(AUTH_PATTERN.LOGIN)
  async login(@Payload() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @MessagePattern(AUTH_PATTERN.GOOGLE_CALLBACK)
  googleCallback(@Payload() user: CreateAuthOAuthDto) {
    return this.authService.handleGoogleCallback(user);
  }

  @MessagePattern(AUTH_PATTERN.VALIDATE_TOKEN)
  async validateToken(@Payload() token: string) {
    return await this.authService.verifyToken(token);
  }

  @MessagePattern(AUTH_PATTERN.REFRESH)
  async getRefreshToken(@Payload() token: string) {
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
}
