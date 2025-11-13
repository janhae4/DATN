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
import { Provider } from '@/types/user.interface';

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/session', credentials);
    return response.data; 
  } catch (error) {
    console.error('Login failed', error);
    throw error; 
  }
};

export const register = async (userData: RegisterData): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>('/auth/account', userData);
    return response.data;
  } catch (error: any) {
    console.error('Registration failed', error);
    // Check if this is an Axios error with response
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const errorMessage = error.response.data?.message || 'Registration failed';
        throw new Error(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      }
    }
    // Something happened in setting up the request that triggered an Error
    throw new Error(error.message || 'Registration failed. Please try again.');
  }
};

export const getMe = async (): Promise<UserProfile> => {
  try {
    const response = await apiClient.get<UserProfile>('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user profile', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/logout`,
      {}, 
      { withCredentials: true } 
    );
  } catch (err) {
    console.warn('Logout API call failed, but redirecting anyway.', err);
  } finally {
    if (typeof window !== 'undefined') {
      console.log('Redirecting to login...');
      window.location.href = '/auth#login'; 
    }
  }
};

// Account Verification
export const verifyEmail = async (token: string) => {
  try {
    const response = await apiClient.get(`/auth/verify-email?token=${token}`);
    return response.data;
  } catch (error) {
    console.error('Email verification failed', error);
    throw error;
  }
};

export const verifyAccount = async (code: string) => {
  try {
    const response = await apiClient.post('/auth/account/verification-code', { code });
    return response.data;
  } catch (error) {
    console.error('Account verification failed', error);
    throw error;
  }
};

export const resendVerificationCode = async () => {
  try {
    const response = await apiClient.post('/auth/account/verification-code/resend');
    return response.data;
  } catch (error) {
    console.error('Failed to resend verification code', error);
    throw error;
  }
};

// Password Management
export const changePassword = async (data: ChangePasswordDto) => {
  try {
    const response = await apiClient.patch('/auth/account/password', data);
    return response.data;
  } catch (error) {
    console.error('Failed to change password', error);
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/password-reset/request', { email });
    return response.data;
  } catch (error) {
    console.error('Failed to request password reset', error);
    throw error;
  }
};

export const resetPassword = async (token: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/password-reset/confirm', { 
      token, 
      password 
    });
    return response.data;
  } catch (error) {
    console.error('Failed to reset password', error);
    throw error;
  }
};

// Session Management
export const refreshToken = async () => {
  try {
    const response = await apiClient.post('/auth/session/refresh');
    return response.data;
  } catch (error) {
    console.error('Failed to refresh token', error);
    throw error;
  }
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