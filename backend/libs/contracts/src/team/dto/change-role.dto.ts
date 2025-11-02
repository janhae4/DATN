import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MemberRole } from './member.dto';

export class ChangeRoleMember {
  @IsString()
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

  @IsString()
  targetId: string;

  @IsString()
  @IsOptional()
  targetName?: string;

  @IsEnum(MemberRole)
  newRole: MemberRole;
}
