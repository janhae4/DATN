import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class RpcErrorToHttpFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Nếu là lỗi RPC kiểu object { error: true, message: {...} }
    if (exception?.error && exception?.message?.statusCode) {
      const status = exception.message.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = exception.message.message || 'Unexpected error';
      return response.status(status).json({ message });
    }

    // Nếu là HttpException thật
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();
      return response.status(status).json(message);
    }

    // Mặc định
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: exception?.message || 'Internal Server Error',
    });
  }
}
