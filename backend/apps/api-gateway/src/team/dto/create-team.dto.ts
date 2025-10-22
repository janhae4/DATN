import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @ApiProperty({
    description: 'The unique identifier of the team to add members to.',
    example: '123123',
  })
  name: string;

  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  @ApiProperty({
    description:
      'An array of unique identifiers of the members to add to the team.',
    example: ['123123', '456456'],
  })
  memberIds: string[];
}
