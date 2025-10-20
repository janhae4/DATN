export class MessageDto {
    userId: string
    message: string
    role: 'user' | 'ai' = 'user'
    conversationId?: string
}