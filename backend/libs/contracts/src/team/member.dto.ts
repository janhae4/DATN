import { Type } from "class-transformer";
import { IsEnum, IsString, Validate } from "class-validator";

export enum MEMBER_ROLE {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}
export class MemberDto {
  @IsString()
  id: string;
  
  @IsEnum(MEMBER_ROLE)
  role: MEMBER_ROLE;
}
