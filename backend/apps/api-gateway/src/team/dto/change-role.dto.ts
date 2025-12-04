import { MemberRole } from '@app/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class ChangeRoleMember {
  @ApiProperty({
    description: 'The new role to assign to the member.',
    enum: MemberRole,
    example: MemberRole.MEMBER,
  })
  @IsEnum(MemberRole)
  role: MemberRole;
}
