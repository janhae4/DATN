"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authService from "@/services/authService";
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
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setUser(null);
      }
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkUserSession = async () => {
      try {
        const profile = await fetchUserProfile();

        // Nếu không lấy được profile (do không có token/token hết hạn) 
        // và không phải đang ở trang auth
        if (!profile && typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
          window.location.href = "/auth";
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkUserSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshUser = async () => {
    try {
      await fetchUserProfile();
      console.log("User profile refreshed");
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const loginResponse = await authService.login(credentials);
      let userProfile = loginResponse.user;
      if (!userProfile) {
        userProfile = await authService.getMe();
      }
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      setUser(null);
      throw error;
    }
  };

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

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
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
