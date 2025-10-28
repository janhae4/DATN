import { NotificationEventDto } from "@app/contracts";

export class SendTeamNotificationDto {
    members: string[];
    message: NotificationEventDto
}