import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class AddMember {
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
