import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDto } from 'apps/user/src/user/dto/user.dto';
import { LoginDto } from './dto/login.dto';
import { UserService } from 'apps/user/src/user/user.service';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

  async createAccessToken(payload: any) {
    return {
      access_token: this.jwtService.sign({sub: payload.id}),
    };
  }
}
