import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.pattern';
import { CHATBOT_CLIENT, INGESTION_CLIENT, RAG_CLIENT } from '@app/contracts/constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

@Injectable()
export class ChatbotService {
    constructor(
        @Inject(INGESTION_CLIENT) private readonly ragClient: ClientProxy
    ) { }

    processDocument(fileName: string, userId: string) {
        this.ragClient.emit(CHATBOT_PATTERN.PROCESS_DOCUMENT, { fileName, userId });
    }
}
