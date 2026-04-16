// src/components/auth/OAuthRedirectHandler.jsx
// Module E – OAuth2 redirect receiver

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * The backend redirects here after a successful Google OAuth2 login:
 *   http://localhost:3000/oauth2/redirect?token=<JWT>
 *
 * This component:
 *  1. Reads the token from the URL query parameter.
 *  2. Passes it to AuthContext.login() which stores it and fetches the profile.
 *  3. Redirects the user to the dashboard.
 *  4. On error, redirects to /login with an error message.
 */
const OAuthRedirectHandler = () => {
    const [searchParams] = useSearchParams();
    const navigate        = useNavigate();
    const { login }       = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
            return;
        }

        if (token) {
            login(token);
            navigate('/dashboard', { replace: true });
        } else {
            navigate('/login?error=No token received', { replace: true });
        }
    }, [searchParams, login, navigate]);

    return (
        <div className="oauth-redirect-loading">
            <div className="spinner" />
            <p>Signing you in…</p>
        </div>
    );
};

export default OAuthRedirectHandler;