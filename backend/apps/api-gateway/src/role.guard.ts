import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './role.decorator';
import { Role } from '@app/contracts/user/user.dto';
import { Request } from 'express';
import { RefreshTokenDto } from '@app/contracts/auth/jwt.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const contextRequest: Request = context.switchToHttp().getRequest();
    const cookies = contextRequest.cookies;
    if (!cookies.accessToken) throw new UnauthorizedException('No token found');
    try {
      const user = await this.jwtService.verifyAsync<RefreshTokenDto>(
        cookies.accessToken as string,
      );
      if (!user) return false;
      return requiredRoles.some((roleRequired) => user.role === roleRequired);
    } catch {
      return false;
    }
  }
}
