import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateAuthLocalDto {
  @IsString()
  username: string;
  @IsString()
  @IsEmail()
  email: string;
  @IsString()
  password: string;
  @IsString()
  name: string;
  @IsOptional()
  @IsString()
  phone?: string;
}
