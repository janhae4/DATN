"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from "react";
import authService from "@/services/authService";
import {
  UserProfile,
  LoginCredentials,
  RegisterData,
  LoginResponse,
} from "@/types/auth";
import { AxiosError } from "axios";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isChecked = useRef(false);

  const fetchUserProfile = async () => {
    try {
      const userProfile = await authService.getMe();
      console.log("User profile fetched:", userProfile);
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      setUser(null);
      setError("Error fetching user profile");
      return null;
    }
  };

  useEffect(() => {
    if (isChecked.current) return;
    isChecked.current = true;
    let isMounted = true;

    const checkUserSession = async () => {
      try {
        await fetchUserProfile();
      } catch (error) {
        console.error("Session check failed:", error);
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
      setIsLoading(true);
      console.log("Login credentials:", credentials);
      const loginResponse = await authService.login(credentials);
      await fetchUserProfile();
      return loginResponse;
    } catch (error) {
      setUser(null);
      console.error("Login error in AuthContext:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      await authService.register(data);
      const loginResponse = await authService.login({
        username: data.username,
        password: data.password,
      });
      await fetchUserProfile();
      return loginResponse;
    } catch (error: any) {
      console.error("Registration error in AuthContext:", error);
      throw error;
    } finally {
      setIsLoading(false);
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
    refreshUser,
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
