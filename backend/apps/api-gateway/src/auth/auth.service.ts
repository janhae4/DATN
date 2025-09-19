import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { LoginDto } from '@app/contracts/auth/login.dto';
import { AUTH_CLIENT, USER_CLIENT } from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy
) { }
  async login(loginDto: LoginDto) {
    const user = await firstValueFrom(this.userClient.send(USER_PATTERNS.VALIDATE, loginDto));
    console.log("user", user);
    if (!user) throw new Error('User not found');
    return this.authClient.send(AUTH_PATTERN.CREATE_ACCESS_TOKEN, {id: user.id});
  }
}
