import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { ClsService } from 'nestjs-cls';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class RpcSpyInterceptor implements NestInterceptor {
    constructor(
        private readonly client: ClientProxy,
        private readonly serviceName: string,
        private readonly cls: ClsService,
    ) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const type = context.getType() as string;
        let traceId = '';
        let actionName = '';
        let inputData: any = {};

        if (type === 'http') {
            const request = context.switchToHttp().getRequest();
            traceId = request.headers['x-trace-id'] || randomUUID();
            actionName = `${request.method} ${request.url}`;
            inputData = request.body;
            request.headers['x-trace-id'] = traceId;
        }

        else if (type === 'rpc' || type === 'rmq') {
            const rpcCtx = context.switchToRpc();
            let rawData = rpcCtx.getData();

            if (Buffer.isBuffer(rawData)) {
                try {
                    inputData = JSON.parse(rawData.toString());
                } catch (e) {
                    inputData = rawData;
                }
            } else if (typeof rawData === 'string') {
                try {
                    inputData = JSON.parse(rawData);
                } catch (e) {
                    inputData = rawData;
                }
            } else {
                inputData = rawData;
            }

            traceId = inputData?.__traceId || inputData?.traceId || randomUUID();
            const ctx = rpcCtx.getContext();
            actionName = typeof ctx.getPattern === 'function' ? ctx.getPattern() : (ctx.fields?.routingKey || 'unknown');
        }

        else {
            return next.handle();
        }
        const startTime = Date.now();

        return new Observable((observer) => {
            this.cls.run(() => {
                this.cls.set('TRACE_ID', traceId);
                const subscription = next.handle().pipe(
                    tap((response) => {
                        this.sendReport(traceId, 'SUCCESS', actionName, inputData, response, Date.now() - startTime);
                    }),
                    catchError((err) => {
                        this.sendReport(traceId, 'ERROR', actionName, inputData, { msg: err.message }, Date.now() - startTime);
                        return throwError(() => err);
                    }),
                ).subscribe(observer);

                return () => subscription.unsubscribe();
            });
        });
    }

    private sendReport(traceId: string, status: string, action: string, input: any, output: any, duration: number) {
        const source = input?.caller || input?.__source || 'API-GATEWAY';

        const target = this.serviceName;

        this.client.emit('spy_report', {
            traceId,
            source,  
            target,
            status,
            action,
            duration,
            timestamp: new Date(),
        }).subscribe();
    }
}