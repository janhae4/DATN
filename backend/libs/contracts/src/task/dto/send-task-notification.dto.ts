import { MemberDto } from "@app/contracts/team/dto/member.dto"
export class SendTaskNotificationDto {
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVED' | 'REJECTED'
    taskIds: string[]
    actor: MemberDto
    teamId: string
    projectId?: string
    details?: {
        taskTitle?: string;
        updatedFields?: string[];
        newStatus?: string;
    }
    timeStamp: Date
}