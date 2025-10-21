export class GetChatMessageConversationDto {
    conversationId: string;
    userId: string;
    page = 1;
    limit = 20
}