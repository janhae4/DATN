import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddMember {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The unique identifier of the team to add members to.',
    example: '123123',
  })
  teamId: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @ApiProperty({
    description:
      'An array of unique identifiers of the members to add to the team.',
    example: ['123123', '456456'],
  })
  memberIds: string[];
}
