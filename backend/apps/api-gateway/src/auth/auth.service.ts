import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { LoginDto } from '@app/contracts/auth/login.dto';
import { AUTH_CLIENT, USER_CLIENT } from '@app/contracts/constants';
import { Inject, Injectable, Res } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy
  ) { }
  async login(loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const user = await firstValueFrom(this.authClient.send(AUTH_PATTERN.LOGIN, { ...loginDto }));
    console.log(user)
    response.cookie('accessToken', user.accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 60 * 1000 * 15
    });
    return user;
  }

  async validateToken(token: string) {
    return this.authClient.send(AUTH_PATTERN.VALIDATE_TOKEN, token);
  }
}
