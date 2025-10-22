import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';
import { MemberDto } from './member.dto';

export class CreateTeamDto {
  @IsString()
  ownerId: string;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(0)
  @IsOptional()
  memberIds?: string[];
}

export interface CreateTeamEventPayload {
  teamId: string;
  ownerId: string;
  ownerName: string;
  name: string;
  members: MemberDto[];
  createdAt: Date;
}
