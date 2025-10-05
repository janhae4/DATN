import { PartialType } from '@nestjs/mapped-types';
import { Role } from '../user/user.dto';

export class JwtDto {
  id: string;
  iat: number;
  exp: number;
  role: Role;
}

export class AccessTokenDto extends PartialType(JwtDto) {}

export class RefreshTokenDto extends PartialType(JwtDto) {
  sessionId: string;
}
