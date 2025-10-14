import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @ApiProperty({
    description: 'Username or email',
    example: 'chanhhy',
    required: true,
  })
  username: string;
  @ApiProperty({
    description: 'Password',
    example: '123123',
    required: true,
  })
  @IsString()
  password: string;
}
