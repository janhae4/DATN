import { MessageSnapshot } from "./message.dto"

export class ResponseMessageDto {
    _id: string
    discussionId: string
    message: MessageSnapshot
}