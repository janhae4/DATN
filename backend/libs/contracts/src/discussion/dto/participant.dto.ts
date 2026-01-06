import { MemberRole } from '@app/contracts/enums/member-role.enum';
import { MemberShip } from '@app/contracts/enums/membership.enum';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';


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
