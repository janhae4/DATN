import apiClient from './apiClient';
import axios from 'axios';
import { 
  LoginCredentials, 
  LoginResponse, 
  RegisterData, 
  UserProfile, 
  ChangePasswordDto, 
  ForgotPasswordDto, 
  VerifyAccountDto,
  ConfirmResetPasswordDto
} from '@/types/auth';
import { db } from "@/public/mock-data/mock-data";

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  
  // MOCK LOGIN
  const mockCred = db.credentials.find(c => c.email === credentials.username && c.password === credentials.password);
  if (mockCred) {
      const user = db.users.find(u => u.id === mockCred.userId);
      if (user) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const accessToken = "mock_access_token_" + user.id;
          
          // Ensure token is saved for getMe to work in mock mode
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
          }

          return {
              accessToken: accessToken,
              refreshToken: "mock_refresh_token_" + user.id,
              user: user,
          } as any;
      }
  }

  try {
    const response = await apiClient.post<LoginResponse>('/auth/session', credentials);
    return response.data; 
  } catch (error) {
    console.error('Login failed', error);
    throw error; 
  }
};

export const register = async (userData: RegisterData): Promise<{ message: string }> => {
  // MOCK REGISTER
  await new Promise(resolve => setTimeout(resolve, 500));
  const newUser = {
      id: `user-${Date.now()}`,
      email: userData.email,
      name: userData.name,
      role: 'USER', // Default role
      isBan: false,
      isActive: true,
      isVerified: false,
      createdAt: new Date().toISOString(),
  };
  // @ts-ignore
  db.users.push(newUser);
  return { message: "Registration successful. Please check your email to verify your account." };
};

export const getMe = async (): Promise<UserProfile> => {
  // MOCK ME
  await new Promise(resolve => setTimeout(resolve, 500));

  if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token && token.startsWith('mock_access_token_')) {
          const userId = token.replace('mock_access_token_', '');
          const user = db.users.find(u => u.id === userId);
          if (user) {
               return user as any;
          }
      }
  }

  // Simulate 401 Unauthorized if no valid mock token found
  throw new Error("Unauthorized");
};

export const logout = async (): Promise<void> => {
  // MOCK LOGOUT
  await new Promise(resolve => setTimeout(resolve, 500));
  if (typeof window !== 'undefined') {
      console.log('Redirecting to login...');
      window.location.href = '/auth#login'; 
  }
};

// Account Verification
export const verifyEmail = async (token: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { message: "Email verified successfully" };
};

export const verifyAccount = async (code: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { message: "Account verified successfully" };
};

export const resendVerificationCode = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { message: "Verification code sent" };
};

// Password Management
export const changePassword = async (data: ChangePasswordDto) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { message: "Password changed successfully" };
};

export const forgotPassword = async (email: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { message: "Password reset email sent" };
};

export const resetPassword = async (token: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { message: "Password reset successfully" };
};

// Session Management
export const refreshToken = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { accessToken: "mock_access_token_refreshed", refreshToken: "mock_refresh_token_refreshed" };
};

// Google Auth
export const initiateGoogleLogin = (type: 'login' | 'link' = 'login') => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/google?type=${type}`;
};

const authService = {
  login,
  register,
  logout,
  getMe,
  verifyEmail,
  verifyAccount,
  resendVerificationCode,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  initiateGoogleLogin
};

export default authService;