import { Controller } from '@nestjs/common';
import { N8nServiceService } from './n8n-service.service';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';
import { N8N_EXCHANGE, N8N_PATTERNS, GenerateTasksPayload } from '@app/contracts';

@Controller()
export class N8nServiceController {
  constructor(private readonly n8nServiceService: N8nServiceService) { }

  @RabbitRPC({
    exchange: N8N_EXCHANGE,
    routingKey: N8N_PATTERNS.GENERATE_TASKS,
    queue: N8N_PATTERNS.GENERATE_TASKS,
    errorHandler: customErrorHandler,
  })
  async generateTasks(payload: GenerateTasksPayload) {
    return this.n8nServiceService.generateTasks(payload);
  }

  @RabbitRPC({
    exchange: N8N_EXCHANGE,
    routingKey: N8N_PATTERNS.SUMMARIZE_CONVERSATION,
    queue: N8N_PATTERNS.SUMMARIZE_CONVERSATION,
    errorHandler: customErrorHandler,
  })
  async summarizeConversation(payload: { messages: any[]; channelName?: string; currentDate: string }) {
    return this.n8nServiceService.summarizeConversation(payload);
  }
}
