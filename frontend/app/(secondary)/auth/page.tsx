'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './auth.module.css';

import { LoginForm } from '@/components/auth/loginForm';
import { SignupForm } from '@/components/auth/signupForm';

import loginImage from '@/public/assets/login_signup_resources/login-img.png';

export default function AuthPage() {
    const [isLoginView, setIsLoginView] = useState(true);

    useEffect(() => {
        const handleHashChange = () => {
            setIsLoginView(window.location.hash !== '#signup');
        };
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    return (
        <div className={styles.page_container}>
            <div className={`${styles.form_section} ${!isLoginView ? styles.form_section_signup : ''}`}>
                <div className={styles.form_wrapper}>
                    <LoginForm isActive={isLoginView} />
                    <SignupForm isActive={!isLoginView} />
                </div>
            </div>
            <div className={`${styles.image_section} ${!isLoginView ? styles.image_section_signup : ''}`}>
                <Image
                    src={loginImage}
                    alt="Auth illustration"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                />
            </div>
        </div>
    );
}