import { MemberRole } from '@app/contracts/team/dto/member.dto';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
export enum MemberShip {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT'
}


export class ParticipantDto {
  @IsString()
  @IsNotEmpty()
  _id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsEnum(MemberRole)
  @IsNotEmpty()
  role: MemberRole;

  @IsEnum(MemberShip)
  @IsOptional()
  status: MemberShip;
}
