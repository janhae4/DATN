import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.pattern';
import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { ChatbotService } from './chatbot.service';
import { ChatbotGateway } from './chatbot.gateway';
import { StorageService } from './storage.service';
import { file } from 'googleapis/build/src/apis/file';

@Controller('chatbot')
export class ChatbotController {
    constructor(private readonly chatbotService: ChatbotService,
        private readonly chatbotGateway: ChatbotGateway,
        private readonly storageService: StorageService
    ) { }

    @MessagePattern(CHATBOT_PATTERN.PROCESS_DOCUMENT)
    processDocument(payload: { fileName: string, userId: string }) {
        return this.chatbotService.processDocument(payload.fileName, payload.userId);
    }

    @EventPattern('rag_response')
    handleStreamResponse(@Payload() response: { socketId: string, type: string, content: string }) {
        console.log(`[Controller] Nhan response tu queue: ${JSON.stringify(response)}`);
        this.chatbotGateway.handleStreamResponse(response);
    }

    @MessagePattern(CHATBOT_PATTERN.UPLOAD_FILE)
    async uploadFile(payload: { file: Express.Multer.File, userId: string }) {
        return await this.storageService.uploadFile(payload.file, payload.userId);
    }

    @MessagePattern(CHATBOT_PATTERN.GET_FILES_BY_USER_ID)
    async getFilesByUserId(userId: string) {
        return await this.storageService.getFilesByUserId(userId);
    }

    @MessagePattern(CHATBOT_PATTERN.DELETE_FILE)
    async deleteFile(payload: { fileId: string }) {
        return await this.storageService.deleteFile(payload.fileId);
    }
}
