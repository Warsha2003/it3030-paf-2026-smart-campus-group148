/**
 * LoginPage.jsx
 * The Auth landing page.
 * 
 * Uses @react-oauth/google's GoogleLogin button.
 * On success: sends credential to backend, stores JWT, redirects to dashboard.
 * Also includes a hidden toggle for Admin (Email/Password) login.
 * 
 * Member 4 - Auth UI
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { credentialLogin } from '../services/authApi';
import { saveToken } from '../utils/tokenUtils';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAdmin, setShowAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect immediately
  const from = location.state?.from?.pathname || '/dashboard';
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleGoogleLogin = () => {
    // Exact redirect routing to Spring Boot
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    window.location.href = `${apiUrl}/oauth2/authorization/google`;
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password required');
      return;
    }
    setLoading(true);
    try {
      const res = await credentialLogin(email, password);
      if (res.success && res.data?.token) {
        saveToken(res.data.token);
        toast.success('Admin login successful!');
        window.location.href = '/admin/users';
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background decorative blobs */}
      <div className="login-page__blob login-page__blob--1" />
      <div className="login-page__blob login-page__blob--2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-card__logo">
          <span className="login-card__logo-icon">🏛️</span>
        </div>

        {/* Heading */}
        <h1 className="login-card__title">Smart Campus</h1>
        <p className="login-card__subtitle">Operations Hub</p>
        <p className="login-card__desc">
          Sign in with your university Google account to access the campus management system.
        </p>

        {/* Divider */}
        <div className="login-card__divider">
          <span>Continue with</span>
        </div>

        {/* Google Login Button */}
        <div className="login-card__google-btn">
          <button 
            type="button" 
            className="google-button" 
            onClick={handleGoogleLogin}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#4285F4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            <svg style={{ width: 18, height: 18, marginRight: 8, fill: 'currentColor' }} viewBox="0 0 24 24">
               <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"></path>
            </svg>
            Sign in with Google
          </button>
        </div>

        {/* Admin Login Toggle Button underneath the Google Button */}
        <div style={{ textAlign: 'center', marginTop: '16px', marginBottom: '16px' }}>
          <button 
             onClick={() => setShowAdmin(!showAdmin)}
             style={{ 
               background: 'none', 
               border: 'none', 
               color: '#6366f1', 
               fontSize: '13px', 
               fontWeight: '600', 
               cursor: 'pointer',
               textDecoration: 'underline'
             }}>
            {showAdmin ? 'Hide Admin Login' : 'System Administrator Login'}
          </button>
        </div>

        {/* Admin Secret Login Form */}
        {showAdmin && (
          <form onSubmit={handleAdminLogin} style={{ 
            marginTop: '16px', 
            padding: '16px', 
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: '#334155' }}>
              Admin Access
            </p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                autoComplete="off"
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Password</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                autoComplete="new-password"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
        )}

        {/* Footer note */}
        <p className="login-card__note" style={{ marginTop: '24px' }}>
          🔒 Secured with OAuth 2.0 & JWT · IT3030 PAF Assignment 2026
        </p>
      </div>
    </div>
  );
}
