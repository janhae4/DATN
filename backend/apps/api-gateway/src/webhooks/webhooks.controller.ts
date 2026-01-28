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
    console.log("[WEBHOOK] handleUploadCompletion", payload.Records?.[0]?.s3?.object);
    try {
      const storageKey = payload.Records?.[0]?.s3?.object;
      if (!storageKey) {
        this.logger.warn('[WEBHOOK] Payload không hợp lệ, thiếu key');
        return res.status(HttpStatus.BAD_REQUEST).send('Invalid payload');
      }

      await this.webhookService.handleUploadCompletion(payload.Records?.[0]?.s3?.object);
      return res.status(HttpStatus.OK).send('Webhook processed');
    } catch (error) {
      this.logger.error(`[WEBHOOK] Xử lý thất bại: ${error.message}`, error.stack);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Processing failed');
    }
  }
}