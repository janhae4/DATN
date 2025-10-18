import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Error as RpcError } from '@app/contracts/error';
import { RpcException } from '@nestjs/microservices';
import { Response } from 'express';

@Catch(RpcException)
export class RpcToHttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const e = exception as RpcError;
    return response
      .status(e.statusCode || HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: e.message });
  }
}
