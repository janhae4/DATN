import { Controller, Post, Body, Logger, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import type { MinioWebhookEvent } from './dto/hook-upload.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhookService: WebhooksService,
  ) { }

  @Post('upload-completed')
  @ApiOperation({ summary: 'Webhook (PUBLIC) to handle upload completion' })
  async handleUploadCompletion(
    @Body() payload: MinioWebhookEvent,
    @Res() res: Response,
  ) {
    try {
      if (!payload.Records || payload.Records.length === 0) {
        this.logger.warn('[WEBHOOK] Payload không có Records');
        return res.status(HttpStatus.OK).send('No records to process');
      }

      this.logger.log(`[WEBHOOK] Nhận được ${payload.Records.length} records`);

      for (const record of payload.Records) {
        const storageKey = record.s3?.object?.key;
        if (storageKey) {
          console.log("[WEBHOOK] handleUploadCompletion", record.s3.object);
          await this.webhookService.handleUploadCompletion(record.s3.object);
        }
      }

      return res.status(HttpStatus.OK).send('Webhook processed');
    } catch (error) {
      this.logger.error(`[WEBHOOK] Xử lý thất bại: ${error.message}`, error.stack);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Processing failed');
    }
  }
}