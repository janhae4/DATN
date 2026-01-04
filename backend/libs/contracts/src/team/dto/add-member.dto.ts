import { ArrayMinSize, IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { EventUserSnapshot } from './create-team.dto';

export class AddMember {
  @IsString()
  @IsOptional()
  requesterId: string;

  @IsString()
  @IsOptional()
  teamId: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one memberId must be provided.' })
  @IsString({ each: true })
  memberIds: string[];
}

export interface AddMemberEventPayload {
  requesterId: string;
  requesterName?: string;
  teamId: string;
  teamName: string;
  members: EventUserSnapshot[];
  memberIdsToNotify: string[]
}
