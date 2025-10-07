import { IsEmail, IsOptional, IsPhoneNumber, IsString } from "class-validator";

export class CreateAuthDto {
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
  @IsPhoneNumber('VN')
  phone?: string;
}
