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
  constructor(private readonly authService: AuthService) {}

  async catch(
    exception: UnauthorizedException,
    host: ArgumentsHost,
  ): Promise<Response> {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    console.info('[RefreshTokenFilter] Triggered');

    const refreshToken = req.cookies.refreshToken as string;
    const accessToken = req.cookies.accessToken as string;

    if (refreshToken && !accessToken) {
      try {
        const token = await firstValueFrom(this.authService.refresh(req, res));

        console.info('[RefreshTokenFilter] Refreshed token:', token);

        req.cookies.accessToken = token.accessToken;
        req.cookies.refreshToken = token.refreshToken;

        const route = req.route as
          | { stack?: Array<{ handle?: (r: Request, s: Response) => unknown }> }
          | undefined;
        const handler = route?.stack?.[0]?.handle;

        if (typeof handler === 'function') {
          const result = handler(req, res);
          return result as Response;
        }
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
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
