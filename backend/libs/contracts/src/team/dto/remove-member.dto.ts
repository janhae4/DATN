import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { EventUserSnapshot } from './create-team.dto';
import { User } from '@app/contracts/user/entity/user.entity';

export class RemoveMember {
  @IsString()
  @IsNotEmpty()
  requesterId: string;

  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsString({ each: true })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one memberId must be provided.',
  })
  memberIds: string[];
}

export interface RemoveMemberEventPayload {
  requesterId: string;
  requesterName?: string;
  teamId: string;
  teamName: string;
  members: User[];
  memberIdsToNotify: string[]
  metadata?: Record<string, any>;
}
