import { CreateNotificationDto, NotificationEventDto, NotificationResource, NotificationTargetType } from './dto/notification-event.dto'; // DTO đầu vào
import { NotificationType } from '@app/contracts/enums/notification-type.enum';
import {
    CreateTeamEventPayload,
    AddMemberEventPayload,
    RemoveMemberEventPayload,
    RemoveTeamEventPayload,
    LeaveMemberEventPayload,
    ChangeRoleMember
} from '@app/contracts';

export class NotificationMapper {

    static fromCreateTeam(payload: CreateTeamEventPayload): CreateNotificationDto {
        const { owner, teamSnapshot } = payload;
        return {
            title: 'New Team',
            message: `${owner.name} created team "${teamSnapshot.name}"`,
            type: NotificationType.SUCCESS,
            targetType: NotificationTargetType.TEAM,
            targetId: teamSnapshot.id,
            resourceType: NotificationResource.TEAM,
            resourceId: teamSnapshot.id,
            actorId: owner.id,
            metadata: { action: 'CREATE_TEAM', teamId: teamSnapshot.id }
        };
    }

    static fromAddMember(payload: AddMemberEventPayload): CreateNotificationDto[] {
        const { requesterName, teamName, teamId, requesterId, memberIdsToNotify } = payload;

        const notifications: CreateNotificationDto[] = [];

        memberIdsToNotify?.forEach(member => {
            notifications.push({
                title: 'Team Invitation',
                message: `${requesterName} added you to team "${teamName}"`,
                type: NotificationType.PENDING,

                targetType: NotificationTargetType.TEAM,
                targetId: member,

                resourceType: NotificationResource.TEAM,
                resourceId: teamId,
                actorId: requesterId,
                metadata: { ...payload.metadata, action: 'ADD_MEMBER_TARGET' }
            });
        });
        return notifications;
    }

    static fromChangeRole(payload: ChangeRoleMember): CreateNotificationDto {
        const { requesterName, teamName, teamId, requesterId, newRole, targetName, targetId } = payload;
        return {
            title: 'Role Changed',
            message: `${requesterName} changed ${targetName}'s role to ${newRole} in team "${teamName}"`,
            type: NotificationType.WARNING,
            targetType: NotificationTargetType.USER,
            targetId: targetId,

            resourceType: NotificationResource.TEAM,
            resourceId: teamId,
            actorId: requesterId,
            metadata: { action: 'CHANGE_ROLE', newRole }
        };
    }

    static fromRemoveMember(payload: RemoveMemberEventPayload): CreateNotificationDto[] {
        const { requesterName, teamName, teamId, requesterId, memberIdsToNotify } = payload;
        const notifications: CreateNotificationDto[] = [];

        memberIdsToNotify.forEach(member => {
            notifications.push({
                title: 'Team Declined',
                message: `${requesterName} kicked you from team "${teamName}"`,
                type: NotificationType.WARNING,

                targetType: NotificationTargetType.USER,
                targetId: member,

                resourceType: NotificationResource.TEAM,
                resourceId: teamId,
                actorId: requesterId,
                metadata: { ...payload.metadata, action: 'REMOVE_MEMBER_TARGET' }
            });
        });
        return notifications;
    }

    static fromLeaveTeam(payload: LeaveMemberEventPayload): CreateNotificationDto {
        const { requester, teamName, teamId } = payload;
        return {
            title: 'Member Left',
            message: `${requester.name} left team "${teamName}"`,
            type: NotificationType.WARNING,
            targetType: NotificationTargetType.TEAM,
            targetId: teamId,
            resourceType: NotificationResource.TEAM,
            resourceId: teamId,
            actorId: requester.id,
            metadata: { action: 'LEAVE_TEAM' }
        };
    }

    static fromRemoveTeam(payload: RemoveTeamEventPayload): CreateNotificationDto {
        const { requesterName, teamName, teamId, requesterId } = payload;
        return {
            title: 'Team Removed',
            message: `${requesterName} removed team "${teamName}"`,
            type: NotificationType.WARNING,
            targetType: NotificationTargetType.TEAM,
            targetId: teamId,
            resourceType: NotificationResource.TEAM,
            resourceId: teamId,
            actorId: requesterId,
            metadata: { action: 'REMOVE_TEAM' }
        };
    }
}