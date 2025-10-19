'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify-icon/react';
import styles from '@/app/(secondary)/auth/auth.module.css';

import GoogleIcon from '@/public/assets/login_signup_resources/google_icon.jpg';
import FacebookIcon from '@/public/assets/login_signup_resources/facebook_icon.jpg';
import XIcon from '@/public/assets/login_signup_resources/x_icon.jpg';

interface SignupFormProps {
    isActive: boolean;
}

export const SignupForm = ({ isActive }: SignupFormProps) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Signup attempt:', { fullName, email, password });
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:3000/auth/google/login';
    };

    return (
        <div className={`${styles.form_inner_container} ${isActive ? styles.active_form : styles.inactive_form}`}>
            <h1 className={styles.title}>Create an Account</h1>
            <div className={styles.social_login_container}>
                <button className={styles.social_button} onClick={handleGoogleLogin}><Image src={GoogleIcon} alt="Google Icon" width={24} height={24} className="w-5 h-auto" /></button>
                <button className={styles.social_button}><Image src={FacebookIcon} alt="Facebook Icon" width={24} height={24} className="w-5 h-auto" /></button>
                <button className={styles.social_button}><Image src={XIcon} alt="X Icon" width={24} height={24} className="w-5 h-auto" /></button>
            </div>
            <div className={styles.separator}><span>or</span></div>
            <form onSubmit={handleSubmit} className={styles.form}>
                <Input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <div className={styles.input_wrapper}>
                    <Input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <span className={styles.eye_icon} onClick={() => setShowPassword(!showPassword)}>
                        <Icon icon={showPassword ? "iconoir:eye-closed" : "iconoir:eye"} width="20" height="20" />
                    </span>
                </div>
                <Button type="submit" className={styles.submit_button}>Get Started</Button>
            </form>
            {/* Sử dụng thẻ <a> để thay đổi URL hash */}
            <p className={styles.switch_form_link}>Already have an account? <a href="#login">Log in</a></p>
        </div>
    );
};