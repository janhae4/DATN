import { MEMBER_ROLE } from '@app/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class ChangeRoleMember {
  @ApiProperty({
    description:
      'The unique identifier of the member whose role is being changed.',
    example: '123123',
  })
  @IsString()
  targetId: string;

  @ApiProperty({
    description: 'The new role to assign to the member.',
    enum: MEMBER_ROLE,
    example: MEMBER_ROLE.MEMBER,
  })
  @IsEnum(MEMBER_ROLE)
  newRole: MEMBER_ROLE;
}
