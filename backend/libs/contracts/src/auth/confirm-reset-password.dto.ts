import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmResetPasswordDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'Token',
    type: String,
    required: false,
  })
  token?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    name: 'User id',
    type: String,
    required: false,
  })
  userId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'Code',
    type: String,
    required: false,
  })
  code?: string;
  
  @IsString()
  @IsOptional()
  @ApiProperty({
    name: 'Password',
    type: String,
    required: false,
  })
  password?: string;
}
