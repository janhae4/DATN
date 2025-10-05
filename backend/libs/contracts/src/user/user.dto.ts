export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}
export class UserDto {
  id: string;
  username: string;
  phone: string;
  password: string;
  name: string;
  role: Role;
  isActive: boolean;
  image?: string;
  bio?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
