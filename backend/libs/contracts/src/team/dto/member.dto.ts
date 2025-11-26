import { MemberRole } from '@app/contracts/enums/member-role.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';



export class MemberDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(MemberRole)
  role: MemberRole;
}
