'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icon } from '@iconify-icon/react';
import styles from '@/app/(secondary)/auth/auth.module.css';
import { useRouter } from 'next/navigation'; // <--- IMPORT
import { useAuth } from '@/contexts/AuthContext'; // <--- IMPORT
import GoogleIcon from '@/public/assets/login_signup_resources/google_icon.jpg';
import FacebookIcon from '@/public/assets/login_signup_resources/facebook_icon.jpg';
import XIcon from '@/public/assets/login_signup_resources/x_icon.jpg';

interface SignupFormProps {
    isActive: boolean;
}

export const SignupForm = ({ isActive }: SignupFormProps) => {
    const [formData, setFormData] = useState<{
        username: string;
        email: string;
        password: string;
        name: string;
        phone?: string;
    }>({
        username: '',
        email: '',
        password: '',
        name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register } = useAuth();
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        
        try {
            await register(formData);
            router.push('/dashboard');
        } catch (error: any) {
            // The error should now be properly propagated from authService
            setError(error.message || 'Registration failed. Please check your information and try again.');
            console.error('Signup error:', error);
        } finally {
            setIsLoading(false);
        }
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
                <Input 
                    type="text" 
                    name="name"
                    placeholder="Full Name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                />
                <Input 
                    type="text" 
                    name="username"
                    placeholder="Username" 
                    value={formData.username} 
                    onChange={handleChange} 
                    required 
                />
                <Input 
                    type="email" 
                    name="email"
                    placeholder="Email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                />
                <div className={styles.input_wrapper}>
                    <Input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password"
                        placeholder="Password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        minLength={6}
                    />
                    <span className={styles.eye_icon} onClick={() => setShowPassword(!showPassword)}>
                        <Icon icon={showPassword ? "iconoir:eye-closed" : "iconoir:eye"} width="20" height="20" />
                    </span>
                </div>
                {error && (
                    <div className="text-red-500 text-sm mb-4 text-center">
                        {error}
                    </div>
                )}
                <Button 
                    type="submit" 
                    className={styles.submit_button}
                    disabled={isLoading}
                >
                    {isLoading ? 'Creating Account...' : 'Get Started'}
                </Button>
            </form>
            <p className={styles.switch_form_link}>Already have an account? <a href="#login">Log in</a></p>
        </div>
    );
};