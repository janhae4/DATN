import {
    Catch,
    ArgumentsHost,
    RpcExceptionFilter as NestRpcExceptionFilter,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class RpcExceptionFilter implements NestRpcExceptionFilter<RpcException> {
    catch(exception: any, host: ArgumentsHost) {
        console.error('[AuthService Error]', exception);
        return throwError(() => exception);
    }

}
