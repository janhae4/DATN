import { IsOptional, IsString } from 'class-validator';

export class ConfirmResetPasswordDto {
  @IsString()
  @IsOptional()
  token?: string;

  @IsOptional()
  @IsString()
  userId?: string
  @IsString()
  @IsOptional()
  code?: string;
  @IsString()
  @IsOptional()
  password?: string;
}
