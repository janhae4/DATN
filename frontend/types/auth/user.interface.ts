// types/user.interface.ts
import { Role } from "../common/enums";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: Role;
  isBan: boolean;
  isActive: boolean;
  isVerified: boolean;
  bio?: string;
  lastLogin?: string;
  createdAt: string;
}