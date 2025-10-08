import {
  Catch,
  RpcExceptionFilter as NestRpcExceptionFilter,
} from '@nestjs/common';
import { throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class RpcExceptionFilter
  implements NestRpcExceptionFilter<RpcException>
{
  catch(exception: RpcException) {
    console.error('[AuthService Error]', exception);
    return throwError(() => exception);
  }
}
