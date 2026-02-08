export interface Reaction {
    emoji: string;
    userIds: string[];
}

export interface MessageSender {
    _id: string;
    name: string;
    avatar?: string;
}

export interface MessageAttachment {
    url: string;
    type: string;
    fileName: string;
    size?: number;
}

export interface ChatMessage {
    _id: string;
    content: string;
    sender: MessageSender;
    createdAt: string;
    updatedAt?: string;
    reactions: Reaction[];
    attachments?: MessageAttachment[];
    isDeleted?: boolean;
    replyTo?: {
        messageId: string;
        content: string;
        senderName: string;
        attachments?: MessageAttachment[];
    };
}
