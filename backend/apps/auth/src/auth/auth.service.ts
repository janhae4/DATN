import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { USER_CLIENT } from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { JwtDto } from '@app/contracts/auth/jwt.dto';
import { LoginDto } from '@app/contracts/auth/login.dto';
import { ConfigModule } from '@nestjs/config';
ConfigModule.forRoot()

@Injectable()
export class AuthService {
  constructor(@Inject(USER_CLIENT) private readonly userClient: ClientProxy, private jwtService: JwtService) { }

  async login(loginDto: LoginDto) {
    const user = await firstValueFrom(this.userClient.send(USER_PATTERNS.VALIDATE, loginDto));
    if (!user) throw new Error('Invalid Credentials');
    const accessToken = this.jwtService.sign({ id: user.id, role: user.role });
    return {
      ...user,
      accessToken: accessToken,
    };
  }

  async validateToken(token: string) {
    try {
      const payload: JwtDto = await this.jwtService.verifyAsync(token as string);
      if (payload.exp < Date.now() / 1000) return null;
      return { id: payload.id, role: payload.role };
    } catch (e) {
      return null;
    }
  }
}
