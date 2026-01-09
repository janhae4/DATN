import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { FILE_EXCHANGE, FILE_PATTERN } from '@app/contracts';

@Injectable()
export class WebhooksService {
    constructor(private readonly amqp: AmqpConnection) { }

    async handleUploadCompletion(storageKey: string) {
        await this.amqp.publish(
            FILE_EXCHANGE,
            FILE_PATTERN.COMPLETE_UPLOAD,
            storageKey
        );
    }
}
