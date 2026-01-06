import { Error } from '@app/contracts';
import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { catchError, Observable, throwError } from 'rxjs';

export function handleRpc<T>(obs: Observable<T>): Observable<T> {
  return obs.pipe(
    catchError((e: any) => {
      const err = e as Error;
      const message = err?.message || 'Internal Server Error';
      const statusCode = err?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;

      const rpcError = new RpcException({
        message,
        statusCode,
      });
      return throwError(() => rpcError);
    }),
  );
}
