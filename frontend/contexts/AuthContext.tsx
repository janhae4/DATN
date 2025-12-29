"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authService, { getMe } from "@/services/authService";
import { UserProfile, LoginCredentials, RegisterData } from "@/types/auth";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserProfile>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      const userProfile = await authService.getMe();
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        if (document.cookie.includes("accessToken")) {
          await fetchUserProfile();
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const refreshUser = async () => {
    try {
      await fetchUserProfile();
      console.log("User profile refreshed");
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  // Hàm login
  const login = async (credentials: LoginCredentials) => {
    try {
      // 1. Gọi API login (BE sẽ set cookie)
      const loginResponse = await authService.login(credentials);

      // 2. Lấy thông tin user nếu cần
      // Chỉ gọi getMe nếu không có thông tin user trong response
      let userProfile = loginResponse.user;
      if (!userProfile) {
        userProfile = await authService.getMe();
      }

      // 3. Cập nhật state toàn cục
      setUser(userProfile);

      return userProfile;
    } catch (error) {
      setUser(null);
      throw error; // Ném lỗi ra cho form xử lý
    }
  };

  // Hàm register
  const register = async (data: RegisterData) => {
    try {
      await authService.register(data);

      const loginResponse = await authService.login({
        username: data.username,
        password: data.password,
      });

      let userProfile = loginResponse.user;

      if (!userProfile) {
        userProfile = await authService.getMe();
      }

      if (userProfile) {
        setUser(userProfile);
      }

      return loginResponse;
    } catch (error: any) {
      console.error("Registration error in AuthContext:", error);
      throw error;
    }
  };

  // Hàm logout
  const logout = () => {
    authService.logout(); //
    setUser(null);
    // authService.logout() đã tự redirect rồi
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  // Chỉ render khi đã check xong session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {" "}
      <GoogleOAuthProvider clientId="387020606917-73crp08jd6l5ntsi27c0kg0g9uo6u0jk.apps.googleusercontent.com">
        {children}
      </GoogleOAuthProvider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
