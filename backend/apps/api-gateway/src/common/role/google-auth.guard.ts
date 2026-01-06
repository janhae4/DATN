import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const req: Request = context.switchToHttp().getRequest();
    const token = req.cookies.accessToken as string;
    return {
      state: JSON.stringify({
        type: (req.query.type as string) || 'login',
        jwt: token || null,
      }),
      accessType: 'offline',
      prompt: 'consent',
    };
  }
}
