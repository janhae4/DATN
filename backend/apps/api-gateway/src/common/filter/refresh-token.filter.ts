import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../api-gateway/routes/auth/auth.service';
import { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';

@Catch(UnauthorizedException)
export class RefreshTokenFilter implements ExceptionFilter {
    constructor(private readonly authService: AuthService) { }

    async catch(exception: UnauthorizedException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();
        const res = ctx.getResponse<Response>();

        console.info('[RefreshTokenFilter] Triggered');
        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            try {
                const token = await firstValueFrom(this.authService.refresh(req, res));
                console.info('[RefreshTokenFilter] Refreshed token:', token);

                req.cookies.accessToken = token.accessToken;
                req.cookies.refreshToken = token.refreshToken;

                return res.status(200).json({
                    message: 'Token refreshed, please retry the request.',
                });
            } catch (e) {
                console.error('[RefreshTokenFilter] Refresh failed:', e.message);
                return res.status(401).json({
                    message: 'Invalid refresh token',
                });
            }
        }

        return res.status(401).json({
            message: exception.message || 'Unauthorized',
        });
    }
}
