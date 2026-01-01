export interface MailAttachment {
    filename: string;
    mimeType: string;
    size: number;
    attachmentId: string;
    data?: string; // Base64 depending on how deep we parse
}

export interface MailDetailResponse {
    id: string;
    threadId: string;
    snippet: string;
    historyId: string;
    internalDate: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    body: string; // HTML or Text
    textPlain?: string;
    attachments: MailAttachment[];
}
