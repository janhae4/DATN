import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  @ApiProperty({
    description: 'Username',
    example: 'chanhhy',
    required: true,
  })
  username: string;

  @IsString()
  @IsEmail()
  @ApiProperty({
    description: 'Email',
    example: 'zodo147@example.com',
    required: true,
  })
  email: string;

  @IsString()
  @ApiProperty({
    description: 'Password',
    example: '123123',
    required: true,
  })
  password: string;

  @IsString()
  @ApiProperty({
    description: 'Name',
    example: 'Chanh Hy',
    required: true,
  })
  name: string;

  @IsPhoneNumber('VN')
  @IsOptional()
  phone?: string;
}
