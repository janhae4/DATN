import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  SYSTEM = 'SYSTEM',
  AI = 'AI'
}

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
