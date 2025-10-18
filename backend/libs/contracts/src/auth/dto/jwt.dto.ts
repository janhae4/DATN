import { Role } from '@app/contracts';
import { PartialType } from '@nestjs/mapped-types';

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
