import { MessageMetadataDto } from "@app/contracts";

export class MessageEvent {
    text: string;
    isCompleted: boolean;
    metadata: MessageMetadataDto;
}