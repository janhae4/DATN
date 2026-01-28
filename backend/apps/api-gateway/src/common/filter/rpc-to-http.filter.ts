import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class RpcErrorToHttpFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcErrorToHttpFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const resPayload =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: exception.message || 'Internal Server Error' };

    const errorResponse = typeof resPayload === 'string'
      ? { message: resPayload }
      : resPayload;

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url}`,
        exception.stack,
      );
    }

    return response.status(status).json({
      timestamp: new Date().toISOString(),
      // path: request.url,
      ...errorResponse as object,
    });
  }
}