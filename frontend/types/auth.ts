import { Provider } from "./user.interface";

// DTOs for authentication
export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
  confirmPassword: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId?: string;
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
}


export interface UserProfile {
  id: string;
  username?: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  provider?: Provider;
  createdAt: string;
  updatedAt: string;
}
