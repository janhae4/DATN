import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { GenerateTasksPayload } from '@app/contracts';

@Injectable()
export class N8nServiceService {
  constructor(private readonly httpService: HttpService) { }

  async generateTasks(payload: GenerateTasksPayload) {
    const n8nUrl = process.env.N8N_WEBHOOK_URL || 'https://alanswift094.app.n8n.cloud/webhook/af9a11d5-a10d-4a8e-873e-1da347f8eb38';

    try {
      const response = await firstValueFrom(
        this.httpService.post(n8nUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        })
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`n8n webhook error: ${response.statusText}`);
      }

      const suggestedTasks: any = response.data;

      // If response is an array and first element has tasks property
      if (Array.isArray(suggestedTasks) && suggestedTasks.length > 0 && suggestedTasks[0].tasks) {
        return suggestedTasks[0].tasks;
      }

      // If response is an object with tasks property
      if (suggestedTasks && suggestedTasks.tasks && Array.isArray(suggestedTasks.tasks)) {
        return suggestedTasks.tasks;
      }

      // If response is an array but wrapped in another array (n8n sometimes does this)
      if (Array.isArray(suggestedTasks) && suggestedTasks.length > 0 && Array.isArray(suggestedTasks[0])) {
        return suggestedTasks[0];
      }

      return suggestedTasks;

    } catch (error) {
      console.error("Error calling n8n:", error);
      throw new BadRequestException("Failed to generate tasks from AI");
    }
  }

  async summarizeConversation(payload: { messages: any[]; channelName?: string; currentDate: string }) {
    const n8nUrl = process.env.N8N_SUMMARIZE_WEBHOOK_URL || 'https://alanswift094.app.n8n.cloud/webhook/sumamrize-conversation';

    try {
      const response = await firstValueFrom(
        this.httpService.post(n8nUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        })
      );

      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`n8n summarize webhook error: ${response.statusText}`);
      }

      const data: any = response.data;

      // Normalize response: n8n can return [ { summary: '...' } ] or { summary: '...' }
      if (Array.isArray(data) && data.length > 0) {
        return data[0].summary ?? data[0];
      }
      if (data && typeof data.summary === 'string') {
        return data.summary;
      }
      return data;

    } catch (error) {
      console.error("Error calling n8n summarize webhook:", error);
      throw new BadRequestException("Failed to summarize conversation");
    }
  }
}
