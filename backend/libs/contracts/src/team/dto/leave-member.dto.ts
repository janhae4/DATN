import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EventUserSnapshot } from './create-team.dto';

export class LeaveMember {
  @IsString()
  @IsNotEmpty()
  requesterId: string;

  @IsString()
  @IsOptional()
  requesterName?: string;

  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsString()
  @IsOptional()
  teamName?: string;
}


export class LeaveMemberEventPayload {
  teamId: string
  teamName: string
  requester: EventUserSnapshot
  memberIdsToNotify: string[]
}