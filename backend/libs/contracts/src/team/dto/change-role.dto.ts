import { MemberRole } from '@app/contracts';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
