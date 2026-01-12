import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TransferOwnership {
  @IsString()
  @ApiProperty({
<<<<<<< HEAD
    description: 'The unique identifier of the team to add members to.',
    example: '123123',
  })
=======
    description: 'The unique identifier of the team.',
    example: '123123',
  })
  teamId: string;

  @IsString()
  @ApiProperty({
    description: 'The unique identifier of the new owner.',
    example: '456456',
  })
>>>>>>> origin/blank_branch
  newOwnerId: string;
}
