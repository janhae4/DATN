import { IsString } from 'class-validator';

export class ConfirmResetPasswordDto {
  @IsString()
  token: string;
  @IsString()
  newPassword: string;
}
