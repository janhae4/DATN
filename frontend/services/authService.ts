import apiClient from './apiClient';
import { 
  LoginCredentials, 
  LoginResponse, 
  RegisterData, 
  UserProfile, 
  ChangePasswordDto,
  VerifyAccountDto,
  ForgotPasswordDto,
  ConfirmResetPasswordDto
} from '@/types/auth';

/**
 * Đăng nhập (Tạo session mới)
 * POST /auth/session
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/session', credentials);
    return response.data; 
  } catch (error) {
    console.error('Login failed', error);
    throw error; 
  }
};

/**
 * Đăng ký tài khoản mới
 * POST /auth/account
 */
export const register = async (userData: RegisterData): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/account', userData);
    return response.data;
  } catch (error) {
    console.error('Registration failed', error);
    throw error;
  }
};

/**
 * Lấy thông tin user hiện tại
 * GET /auth/me
 */
export const getMe = async (): Promise<UserProfile> => {
  const response = await apiClient.get<UserProfile>('/auth/me');
  return response.data;
};

/**
 * Đăng xuất (Xóa session hiện tại)
 * DELETE /auth/session
 */
export const logout = async (): Promise<void> => {
  try {
    await apiClient.delete('/auth/session');
    if (typeof window !== 'undefined') {
      window.location.href = '/auth#login'; 
    }
  } catch (error) {
    console.error('Logout failed', error);
    if (typeof window !== 'undefined') {
      window.location.href = '/auth#login'; 
    }
  }
};

/**
 * Đăng xuất tất cả thiết bị (Optional)
 * DELETE /auth/sessions
 */
export const logoutAll = async (): Promise<void> => {
    await apiClient.delete('/auth/sessions');
};

// --- Account Verification ---

/**
 * Xác thực bằng Email Token (Link từ email)
 * GET /auth/verify-email?token=...
 */
export const verifyEmail = async (token: string) => {
  // Giả định backend nhận token qua query param
  const response = await apiClient.get(`/auth/verify-email?token=${token}`);
  return response.data;
};

/**
 * Xác thực bằng Mã Code (OTP) khi đã đăng nhập (hoặc kèm session tạm)
 * POST /auth/account/verification-code
 */
export const verifyAccount = async (code: string) => {
  const payload: VerifyAccountDto = { code };
  const response = await apiClient.post('/auth/account/verification-code', payload);
  return response.data;
};

/**
 * Gửi lại mã xác thực
 * POST /auth/account/verification-code/resend
 */
export const resendVerificationCode = async () => {
  const response = await apiClient.post('/auth/account/verification-code/resend');
  return response.data;
};

// --- Password Management ---

/**
 * Đổi mật khẩu (Khi đang đăng nhập)
 * PATCH /auth/account/password
 */
export const changePassword = async (data: ChangePasswordDto) => {
  const response = await apiClient.patch('/auth/account/password', data);
  return response.data;
};

/**
 * Quên mật khẩu (Yêu cầu gửi mail reset)
 * POST /auth/password-reset/request
 */
export const forgotPassword = async (email: string) => {
  const payload: ForgotPasswordDto = { email };
  const response = await apiClient.post('/auth/password-reset/request', payload);
  return response.data;
};

/**
 * Xác nhận mật khẩu mới (Từ token reset)
 * POST /auth/password-reset/confirm
 */
export const resetPassword = async (token: string, password: string) => {
  const payload: ConfirmResetPasswordDto = { token, password };
  const response = await apiClient.post('/auth/password-reset/confirm', payload);
  return response.data;
};

// --- Session Management ---

/**
 * Làm mới Access Token
 * POST /auth/session/refresh
 */
export const refreshToken = async () => {
  const response = await apiClient.post('/auth/session/refresh');
  return response.data;
};

// --- Google Auth ---

/**
 * Bắt đầu đăng nhập Google
 * GET /auth/google
 */
export const initiateGoogleLogin = () => {
  window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/google`;
};

const authService = {
  login,
  register,
  logout,
  logoutAll,
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