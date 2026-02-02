import { NotificationType } from "@app/contracts/enums";
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsUUID, IsObject } from "class-validator";

export enum NotificationResource {
  TASK = 'TASK',
  COMMENT = 'COMMENT',
  TEAM = 'TEAM',
  SYSTEM = 'SYSTEM',
  DISCUSSION = 'DISCUSSION'
}

export enum NotificationTargetType {
  USER = 'USER',
  TEAM = 'TEAM'
}

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;
  @IsString()
  @IsNotEmpty()
  message: string;
  @IsEnum(NotificationType)
  type: NotificationType;
  @IsEnum(NotificationTargetType)
  targetType: NotificationTargetType;
  @IsUUID()
  targetId: string;
  @IsEnum(NotificationResource)
  @IsOptional()
  resourceType?: NotificationResource;
  @IsString()
  @IsOptional()
  resourceId?: string;

  @IsUUID()
  @IsOptional()
  actorId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class NotificationEventDto {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}