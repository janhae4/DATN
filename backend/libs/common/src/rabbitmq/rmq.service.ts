import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RmqClientService {
    constructor(private readonly amqp: AmqpConnection) { }

    async request<T>({
        exchange,
        routingKey,
        payload,
    }: {
        exchange: string;
        routingKey: string;
        payload: {
            [key: string]: any
        } | string
    }): Promise<T> {
        try {
            const response = await this.amqp.request<any>({
                exchange,
                routingKey,
                payload,
                timeout: 10000,
            });

            if (response && response.error) {
                console.log(response);  
                console.error(`RPC Error [${routingKey}]:`, response.message);

                throw new HttpException(
                    response.message || 'Internal RPC Error',
                    response.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return response as T;

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