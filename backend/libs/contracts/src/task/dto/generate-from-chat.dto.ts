export class GenerateTasksFromChatDto {
    channelId: string;
    serverId: string;
    teamId: string;
    projectId?: string;
    sprintId?: string;
    messageLimit?: number; // Default 50
}

export class ChatMessageDto {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
    attachments?: any[];
}

export class ChatContextDto {
    channelName: string;
    messages: ChatMessageDto[];
    participants: {
        id: string;
        name: string;
        role?: string;
    }[];
}
