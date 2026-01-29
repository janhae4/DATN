import { Injectable } from '@nestjs/common';
import { FILE_EXCHANGE, FILE_PATTERN } from '@app/contracts';
import { S3Object } from './dto/hook-upload.dto';
import { RmqClientService } from '@app/common';

@Injectable()
export class WebhooksService {
    constructor(private readonly amqp: RmqClientService) { }

    async handleUploadCompletion(object: S3Object) {
        return await this.amqp.publish(
            FILE_EXCHANGE, 
            FILE_PATTERN.COMPLETE_UPLOAD,
            object
        );
    }
}
