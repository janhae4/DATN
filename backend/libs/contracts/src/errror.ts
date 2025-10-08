import { RpcException } from '@nestjs/microservices';

export class UnauthorizedException extends RpcException {
  constructor(message: string = 'Unauthorized') {
    super({ error: 'Unauthorized', status: 401, message });
  }
}

export class ForbiddenException extends RpcException {
  constructor(message: string = 'Forbidden') {
    super({ error: 'Forbidden', status: 403, message });
  }
}

export class NotFoundException extends RpcException {
  constructor(message: string = 'Not found') {
    super({ error: 'Not found', status: 404, message });
  }
}

export class ConflictException extends RpcException {
  constructor(message: string = 'Conflict') {
    super({ error: 'Conflict', status: 409, message });
  }
}

export class BadRequestException extends RpcException {
  constructor(message: string = 'Bad request') {
    super({ error: 'Bad request', status: 400, message });
  }
}

export interface Error {
  error: string;
  status: number;
  message: string;
}
