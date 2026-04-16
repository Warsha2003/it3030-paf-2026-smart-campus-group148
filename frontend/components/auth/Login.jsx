// src/components/auth/Login.jsx
// Module E – Login page with Google OAuth2 button

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGoogleLoginUrl } from '../../api/authApi';
import './Login.css';

/**
 * Login page shown to unauthenticated users.
 *
 * Clicking "Sign in with Google" navigates the browser to the Spring Boot
 * OAuth2 authorization endpoint which then redirects to Google and finally
 * back to /oauth2/redirect with a JWT token.
 *
 * If the backend returns ?error=... (auth failure), an alert is shown.
 */
const Login = () => {
    const { isAuthenticated } = useAuth();
    const navigate            = useNavigate();
    const [searchParams]      = useSearchParams();
    const [error, setError]   = useState('');

    // Redirect already-authenticated users away from the login page
    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', { replace: true });
    }, [isAuthenticated, navigate]);

    // Surface any OAuth2 error from the redirect
    useEffect(() => {
        const err = searchParams.get('error');
        if (err) setError(decodeURIComponent(err));
    }, [searchParams]);

    const handleGoogleLogin = () => {
        window.location.href = getGoogleLoginUrl();
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Logo / branding */}
                <div className="login-logo">
                    <span className="login-logo-icon">🏛️</span>
                    <h1 className="login-title">Smart Campus</h1>
                    <p className="login-subtitle">Operations Hub</p>
                </div>

                <p className="login-description">
                    Manage facility bookings and maintenance from one place.
                    Sign in with your university Google account to get started.
                </p>

                {/* Error banner */}
                {error && (
                    <div className="login-error" role="alert">
                        <span>⚠️ {error}</span>
                        <button onClick={() => setError('')} aria-label="Dismiss">✕</button>
                    </div>
                )}

                {/* Google Sign-In button */}
                <button
                    className="btn-google"
                    onClick={handleGoogleLogin}
                    aria-label="Sign in with Google"
                >
                    <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Sign in with Google
                </button>

                <p className="login-footer">
                    By signing in you agree to the university's IT usage policy.
                </p>
            </div>
        </div>
    );
};

export default Login;