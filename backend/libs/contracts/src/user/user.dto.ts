export enum Role {
<<<<<<< HEAD
  User = 'User',
  Admin = 'Admin',
=======
  USER = 'USER',
  ADMIN = 'ADMIN',
>>>>>>> main
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
