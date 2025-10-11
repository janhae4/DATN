import { Catch } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class RpcExceptionFilter implements RpcExceptionFilter {
  catch(exception: RpcException) {
    console.error('[AuthService Error]', exception);
    return throwError(() => exception);
  }
}
