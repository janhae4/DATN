import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum MEMBER_ROLE {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}
export class MemberDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(MEMBER_ROLE)
  role: MEMBER_ROLE;
}
