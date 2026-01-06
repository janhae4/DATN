// types/auth.ts
import { Provider } from "../common/enums";
import type { User } from "./user.interface";

export interface Account {
  id: string; // uuid
  provider: Provider;
  providerId: string;
  email?: string;
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
  user_id: string; // uuid
}

// Auth DTOs and helper types
export interface LoginCredentials {
  username: string;
  password: string;
}

export type UserProfile = User;

export interface LoginResponse {
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyAccountDto {
  code: string;
}

export interface ConfirmResetPasswordDto {
  token: string;
  password: string;
}

