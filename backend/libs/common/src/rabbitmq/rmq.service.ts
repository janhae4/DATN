import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RmqClientService {
    constructor(
        private readonly amqp: AmqpConnection,
    ) { }

    async request<T>({
        exchange,
        routingKey,
        payload,
        timeout = 60000 * 2,
    }: {
        exchange: string;
        routingKey: string;
        payload: {
            [key: string]: any
        } | string;
        timeout?: number;
    }): Promise<T> {
        try {
            const executeRequest = async () => {
                const response = await this.amqp.request<any>({
                    exchange,
                    routingKey,
                    payload,
                });

                if (response && response.error) {
                    console.error(`RPC Error [${routingKey}]:`, response.message);
                    throw new HttpException(
                        response.message || 'Internal RPC Error',
                        response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
                    );
                }
                return response as T;
            };

            const maxRetries = 3;
            let currentDelayMs = 1000;
            let retries = 0;

            while (true) {
                try {
                    return await executeRequest();
                } catch (error) {
                    if (error instanceof HttpException) {
                        const status = error.getStatus();
                        if (status !== HttpStatus.GATEWAY_TIMEOUT && status !== HttpStatus.INTERNAL_SERVER_ERROR) {
                            throw error;
                        }
                    }

                    if (retries >= maxRetries - 1) {
                        throw error;
                    }

                    retries++;
                    console.warn(`[RMQ Retry] Request to ${routingKey} failed. Retrying in ${currentDelayMs}ms... (Attempt ${retries}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, currentDelayMs));
                    currentDelayMs *= 2; 
                }
            }

        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            console.error('RMQ Request Failed:', error);
            throw new HttpException('Service Unavailable', HttpStatus.GATEWAY_TIMEOUT);
        }
    }

    async publish(exchange: string, routingKey: string, payload: any) {
        try {
            await this.amqp.publish(exchange, routingKey, payload);
        } catch (error) {
            console.error('RMQ Publish Failed:', error);
            throw new HttpException('Service Unavailable', HttpStatus.GATEWAY_TIMEOUT);
        }
    }
}