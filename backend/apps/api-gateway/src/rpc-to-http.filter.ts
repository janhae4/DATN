import { Error } from '@app/contracts/errror';
import { Catch, ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();

    const error = exception.getError() as Error;

    const status = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    response.status(status).json({
      statusCode: status,
      message,
      error: error.error || 'RPC Error',
    });
  }
}
