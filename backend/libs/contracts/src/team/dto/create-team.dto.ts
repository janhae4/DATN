import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  ownerId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @IsOptional()
  memberIds?: string[];
}

export interface EventUserSnapshot {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
}

export interface TeamSnapshot {
  id: string;
  name: string;
  avatar?: string;
}

export interface CreateTeamEventPayload {
  owner: EventUserSnapshot;
  members: EventUserSnapshot[];
  teamSnapshot: TeamSnapshot;
  membersToNotify: string[];
  createdAt: Date;
}