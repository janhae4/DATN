// types/user.interface.ts
import { Role, Provider } from "../common/enums";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
  role: Role;
  provider?: Provider;
  isBan: boolean;
  isActive: boolean;
  isVerified: boolean;
  bio?: string;
  lastLogin?: string;
  createdAt: string;
}