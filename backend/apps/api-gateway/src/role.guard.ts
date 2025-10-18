import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, JwtDto } from '@app/contracts';
import { Request } from 'express';
import { AuthService } from './auth/auth.service';
import { ROLES_KEY } from './common/role/role.decorator';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
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
    if (!cookies.accessToken) return false;
    try {
      const userObservable = this.authService.validateToken(
        cookies.accessToken as string,
      ) as Observable<JwtDto>;

      const user = await firstValueFrom(userObservable);
      if (!user) return false;
      return requiredRoles.some((roleRequired) => user.role === roleRequired);
    } catch {
      return false;
    }
  }
}
