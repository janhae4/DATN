import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @ApiProperty({
    name: 'email or username',
    description: 'Email or username',
    example: 'zodo147@gmail.com',
    required: true,
  })
  email: string;
}
