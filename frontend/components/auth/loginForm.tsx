"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react"; // Icon loading chuẩn
import { Icon } from "@iconify-icon/react";
import { teamService } from "@/services/teamService";
// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

// Logic & Styles
import { useAuth } from "@/contexts/AuthContext";
import { initiateGoogleLogin } from "@/services/authService";
import styles from "@/app/(secondary)/auth/auth.module.css";

// Assets
import GoogleIcon from "@/public/assets/login_signup_resources/google_icon.jpg";
import FacebookIcon from "@/public/assets/login_signup_resources/facebook_icon.jpg";
import XIcon from "@/public/assets/login_signup_resources/x_icon.jpg";
import { useTeams } from "@/hooks/useTeam";
import { projectService } from "@/services/projectService";

interface LoginFormProps {
  isActive: boolean;
  onToggle: () => void;
}

export const LoginForm = ({ isActive, onToggle }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await login({ username, password });
      console.log(response);
      if (response.isFirstLogin) {
        router.push("/auth/onboarding");
      } else if (joinCode) {
        router.push(`/invite/${joinCode}`);
      } else {
        try {
          const teams = await teamService.getTeams();

          if (!teams || teams.length === 0) {
            router.push("/team-create");
            return;
          }

          const teamId = teams[0].id;
          const projects = await projectService.getProjects(teamId);

          if (projects && projects.length > 0) {
            router.push(`/${teamId}/${projects[0].id}/dashboard`);
          } else {
            router.push(`/${teamId}`);
          }
        } catch (teamError) {
          console.error("Failed to fetch teams or projects after login:", teamError);
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.log(error);
      setIsLoading(false);
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || error.response.data?.error;
        if (serverMessage === "Unauthorized" || error.response.status === 401) {
          setError("Invalid username or password.");
        } else {
          setError(serverMessage || "Login failed.");
        }
      } else {
        setError(error.message || "An error occurred.");
      }
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  return (
    <div
      className={`${styles.form_inner_container} ${isActive ? styles.active_form : styles.inactive_form
        } flex flex-col justify-center px-4 sm:px-0`} // Thêm padding cho mobile
    >
      <div className="w-full max-w-[400px] mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </div>

        {/* Social Login Section */}
        <div className={styles.social_login_container}>
          <button className={styles.social_button} onClick={handleGoogleLogin}>
            <Image
              src={GoogleIcon}
              alt="Google Icon"
              width={24}
              height={24}
              className="w-5 h-auto"
            />
          </button>
          <button className={styles.social_button}>
            <Image
              src={FacebookIcon}
              alt="Facebook Icon"
              width={24}
              height={24}
              className="w-5 h-auto"
            />
          </button>
          <button className={styles.social_button}>
            <Image
              src={XIcon}
              alt="X Icon"
              width={24}
              height={24}
              className="w-5 h-auto"
            />
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="name@example.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="h-10"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs text-primary hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-10 pr-10" // Padding phải để tránh text đè lên icon
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                <Icon
                  icon={showPassword ? "iconoir:eye-closed" : "iconoir:eye"}
                  width="20"
                  height="20"
                />
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox id="remember" />
            <Label
              htmlFor="remember"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </Label>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-1">
              <Icon icon="lucide:alert-circle" width="16" height="16" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          Do not have an account?{" "}
          <button
            type="button"
            onClick={onToggle}
            className="text-primary font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
          >
            Create now
          </button>
        </div>
      </div>
    </div>
  );
};
