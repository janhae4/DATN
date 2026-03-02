import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@app/contracts';
import { Request } from 'express';
import { ROLES_KEY } from './role.decorator';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class RoleGuard implements CanActivate {
  private logger = new Logger(RoleGuard.name);
  constructor(
    private reflector: Reflector,
    private readonly authService: AuthService,
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
    let token = contextRequest.cookies?.accessToken;

    if (!token) {
      const authHeader = contextRequest.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) throw new UnauthorizedException('No token found');
    try {
      const user = await this.authService.validateToken(token as string)
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
