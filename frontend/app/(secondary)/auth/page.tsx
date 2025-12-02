"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./auth.module.css";

import { LoginForm } from "@/components/auth/loginForm";
import { SignupForm } from "@/components/auth/signupForm";

import loginImage from "@/public/assets/login_signup_resources/auth_img_dark.jpg";

export default function AuthPage() {
 
  const [isLoginView, setIsLoginView] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#signup") {
      setIsLoginView(false);
    }
  }, []);
  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div className="flex h-screen">
      {/* Form Section: Di chuyển dựa trên state */}
      <div
        className={`${styles.form_section} ${
          !isLoginView ? styles.form_section_signup : ""
        }`}
      >
        <div className={styles.form_wrapper}>
          {/* Truyền hàm toggleView vào props */}
          <LoginForm isActive={isLoginView} onToggle={toggleView} />
          <SignupForm isActive={!isLoginView} onToggle={toggleView} />
        </div>
      </div>

      {/* Image Section: Di chuyển ngược lại */}
      <div
        className={`${styles.image_section} ${
          !isLoginView ? styles.image_section_signup : ""
        }`}
      >
        <Image
          src={loginImage}
          alt="Auth illustration"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          priority // Nên thêm priority cho ảnh LCP
        />
      </div>
    </div>
  );
}
