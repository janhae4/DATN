import { IsString } from 'class-validator';

export class VerifyAccountDto {
  @IsString()
  code: string;
}
