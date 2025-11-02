import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtDto, Role } from '@app/contracts';
import { Request } from 'express';
import { ROLES_KEY } from './role.decorator';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class RoleGuard implements CanActivate {
  private logger = new Logger(RoleGuard.name);
  constructor(
    private reflector: Reflector,
    private readonly authService: AuthService,
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
      this.logger.log('[RoleGuard] Validating token...');
      const user = await this.authService.validateToken(cookies.accessToken as string)
      this.logger.log('[RoleGuard] Token validated:', user.id);
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
    } catch (err: unknown) {
      const error = err as Error;
      this.logger.error('[RoleGuard] Token validation failed:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
