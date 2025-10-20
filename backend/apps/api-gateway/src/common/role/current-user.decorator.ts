import { JwtDto } from "@app/contracts";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const payload = request.user as JwtDto;
        return data ? payload?.[data] : payload;
    },
);