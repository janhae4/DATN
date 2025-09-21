import { CanActivate, ExecutionContext, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { firstValueFrom, Observable } from "rxjs";
import { Role } from "../enums/role.enum";
import { ROLES_KEY } from "./role.decorator";
import { AUTH_CLIENT } from "@app/contracts/constants";
import { ClientProxy } from "@nestjs/microservices";
import { AUTH_PATTERN } from "@app/contracts/auth/auth.patterns";
import { AuthService } from "./auth/auth.service";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private authService: AuthService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ])

        if (!requiredRoles) {
            return true;
        }

        const { cookies } = context.switchToHttp().getRequest()
        if (!cookies.accessToken) return false
        try {
            const user = await firstValueFrom(await this.authService.validateToken(cookies.accessToken))
            console.log(user)
            if (!user) return false
            return requiredRoles.some((roleRequired) => user.role.includes(roleRequired))
        } catch {
            return false
        }
    }
}