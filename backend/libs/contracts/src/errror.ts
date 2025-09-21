import { RpcException } from "@nestjs/microservices";

export class UnauthorizedException extends RpcException {
    constructor(message: string = 'Unauthorized') {
        super({ error: 'Unauthorized', status: 401, message });
    }
}