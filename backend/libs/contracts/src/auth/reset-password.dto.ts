import { IsOptional, IsString, IsUUID } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsUUID()
  id?: string;
  @IsString()
  oldPassword: string;
  @IsString()
  newPassword: string;
}
