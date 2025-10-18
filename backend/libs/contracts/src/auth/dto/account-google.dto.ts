import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthOAuthDto } from './create-auth-oauth.dto';

export class GoogleAccountDto extends PartialType(CreateAuthOAuthDto) {
  accessToken: string;
  refreshToken: string;
  isLinking: boolean;
  linkedUser?: string;
}
