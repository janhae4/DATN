"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { Icon } from "@iconify-icon/react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Logic & Styles
import { useAuth } from "@/contexts/AuthContext";
import { initiateGoogleLogin } from "@/services/authService";
import styles from "@/app/(secondary)/auth/auth.module.css";
import GoogleIcon from "@/public/assets/login_signup_resources/google_icon.jpg";

interface SignupFormProps {
  isActive: boolean;
  onToggle: () => void;
}

export const SignupForm = ({ isActive, onToggle }: SignupFormProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinCode = searchParams.get("join");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await register(formData);

      try {
        if (joinCode) {
          router.push(`/invite/${joinCode}`);
        } else {
          router.push("/auth#login");
        }
      } catch (teamError) {
        console.error("Failed to fetch teams after signup:", teamError);
        router.push("/auth#signup");
      }

    } catch (error: any) {
      setIsLoading(false);

      if (axios.isAxiosError(error) && error.response) {
        const serverMessage =
          error.response.data?.message || error.response.data?.error;
        setError(serverMessage || "Registration failed.");
      } else {
        setError(error.message || "An error occurred.");
      }
    } finally {
      if (!error) {
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleLogin();
  };

  return (
    <div
      className={`${styles.form_inner_container} ${isActive ? styles.active_form : styles.inactive_form
        } flex flex-col justify-center h-full`}
    >
      <div className="w-full max-w-[400px] mx-auto px-4 sm:px-0 overflow-y-auto max-h-full py-4 scrollbar-hide">
        <div className="space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>

          <div className={styles.social_login_container}>
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className={styles.social_button}
              title="Sign up with Google"
            >
              <Image src={GoogleIcon} alt="Google" width={20} height={20} />
            </Button>

          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
                className="h-10 bg-background"
              />
            </div>

            {/* Username & Email Group - Stack on mobile, side-by-side on md */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  type="text"
                  name="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="h-10 bg-background"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="h-10 pr-10 bg-background"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  tabIndex={-1}
                >
                  <Icon
                    icon={showPassword ? "iconoir:eye-closed" : "iconoir:eye"}
                    width="20"
                    height="20"
                  />
                </button>
              </div>
              <p className="text-[0.8rem] text-muted-foreground">
                Must be at least 6 characters.
              </p>
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
              className="w-full h-11 font-semibold transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pb-2">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onToggle}
              className="text-primary font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
