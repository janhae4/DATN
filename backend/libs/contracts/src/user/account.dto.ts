import { IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserDto } from './user.dto';
export enum Provider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
}

export class AccountDto {
  @IsUUID()
  id: string;

  @IsEnum(Provider)
  provider: Provider;

  @IsString()
  providerId: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsObject()
  user: UserDto;

  createdAt: Date;
  updatedAt: Date;
}
