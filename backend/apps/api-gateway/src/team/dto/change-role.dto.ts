import { MemberRole } from '@app/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class ChangeRoleMember {
  @IsString()
  teamId: string;

  @ApiProperty({
    description:
      'The unique identifier of the member whose role is being changed.',
    example: '123123',
  })
  @IsString()
  targetId: string;

  @ApiProperty({
    description: 'The new role to assign to the member.',
    enum: MemberRole,
    example: MemberRole.MEMBER,
  })
  @IsEnum(MemberRole)
  newRole: MemberRole;
}
