import { DynamicModule, Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { RpcSpyInterceptor } from './rpc-spy.interceptor';
import { ClsModule, ClsService } from 'nestjs-cls';
import { ClientConfigService } from '@app/contracts';

@Global()
@Module({})
export class SpyModule {
    static forRoot(serviceName: string): DynamicModule {
        return {
            module: SpyModule,
            imports: [
                ClientsModule.registerAsync([
                    {
                        name: 'SPY_CLIENT',
                        useFactory: (config: ClientConfigService) => ({
                            transport: Transport.RMQ,
                            options: {
                                urls: [config.getRMQUrl()],
                                queue: serviceName,
                                queueOptions: { durable: true },
                            },
                        }),
                        inject: [ClientConfigService],
                    },
                ]),
                ClsModule
            ],
            providers: [
                {
                    provide: APP_INTERCEPTOR,
                    useFactory: (client: ClientProxy, cls: ClsService) => {
                        return new RpcSpyInterceptor(client, serviceName, cls);
                    },
                    inject: ['SPY_CLIENT', ClsService],
                },
            ],
        };
    }
}