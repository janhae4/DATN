import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsUUID()
  @ApiProperty({
    description: 'User id',
    type: String,
    required: false,
  })
  id?: string;

  @IsString()
  @ApiProperty({
    description: 'Old password',
    type: String,
    required: true,
  })
  oldPassword: string;

  @IsString()
  @ApiProperty({
    description: 'New password',
    type: String,
    required: true,
  })
  newPassword: string;
}
