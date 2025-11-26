import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MemberRole } from '@app/contracts';
export class ActionRole {
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
  @IsOptional()
  newRole?: MemberRole;
}
