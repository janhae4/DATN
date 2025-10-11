import { AccountDto } from './account.dto';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum Provider {
  LOCAL = 'LOCAL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
}

export class UserDto {
  id: string;
  username: string;
  name: string;
  email: string;
  provider: Provider;
  password?: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  verifiedCode?: string;
  expiredCode?: string;
  resetCode?: string;
  image?: string;
  phone?: string;
  bio?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  accounts?: AccountDto[];
}
