import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@app/contracts/user/user.dto';
import { Request } from 'express';
import { ROLES_KEY } from './role.decorator';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../api-gateway/routes/auth/auth.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly authService: AuthService
  ) { }

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
      const user = await firstValueFrom(this.authService.validateToken(cookies.accessToken));
      if (!user) throw new UnauthorizedException('Invalid token');
      contextRequest.user = user;
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      const hasRole = requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role');
      }

      return true;
    } catch(err) {
      console.error('[RoleGuard] Token validation failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
