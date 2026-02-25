
import { Epic } from '../epic/entity/epic.entity';

export interface ChatMessageContext {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    createdAt: string | Date;
    attachments?: any[];
    replyTo?: {
        messageId: string;
        content: string;
        senderName: string;
        attachments?: any[];
    };
}

export interface ChatParticipantContext {
    id: string;
    name: string;
}

export interface ChatContext {
    channelName: string;
    messages: ChatMessageContext[];
    participants: ChatParticipantContext[];
}

export interface MemberSkillContext {
    skillName: string;
    exp?: number;
    experience?: number;
}

export interface TeamMemberContext {
    id: string;
    name: string;
    avatar?: string;
    skills?: MemberSkillContext[];
    [key: string]: any;
}

export class GenerateTasksPayload {
    objective: string;
    chatContext: ChatContext;
    members: TeamMemberContext[];
    epics?: Epic[];
    currentDate: string;
}
