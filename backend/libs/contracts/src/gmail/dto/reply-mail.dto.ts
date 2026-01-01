export class ReplyMailDto {
    userId: string;
    threadId: string;
    messageId: string;
    to: string;
    subject: string;
    content: string;
    attachments?: Array<{
        filename: string;
        content: any; // Buffer or string (base64)
        contentType: string;
    }>;
}
