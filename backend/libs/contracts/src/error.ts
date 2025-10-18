import { RpcException } from '@nestjs/microservices';

export class UnauthorizedException extends RpcException {
  constructor(message: string = 'Unauthorized') {
    super({ error: 'Unauthorized', statusCode: 401, message });
  }
}

export class ForbiddenException extends RpcException {
  constructor(message: string = 'Forbidden') {
    super({ error: 'Forbidden', statusCode: 403, message });
  }
}

export class NotFoundException extends RpcException {
  constructor(message: string = 'Not found') {
    super({ error: 'Not found', statusCode: 404, message });
  }
}

export class ConflictException extends RpcException {
  constructor(message: string = 'Conflict') {
    super({ error: 'Conflict', statusCode: 409, message });
  }
}

export class BadRequestException extends RpcException {
  constructor(message: string = 'Bad request') {
    super({ error: 'Bad request', statusCode: 400, message });
  }
}

export interface Error {
  error: string;
  statusCode: number;
  message: string;
}
