import { JwtDto } from '@app/contracts';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtDto | undefined, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();
    const payload = request.user as JwtDto;
    return data ? payload?.[data] : payload;
  },
);
