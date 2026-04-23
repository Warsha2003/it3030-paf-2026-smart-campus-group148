import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveToken, saveUser } from '../utils/tokenUtils';

export default function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      saveToken(token);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('User profile from OAuth:', data);
          if (data.success && data.data) {
            const userData = data.data;
            // Debug: log profile picture
            console.log('Profile picture URL:', userData.profilePicture);
            saveUser(userData);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch user profile:', err);
        })
        .finally(() => {
          window.location.href = '/dashboard';
        });
    } else {
      console.error('No token found in OAuth2 redirect URL');
      navigate('/login?error=oauth2_failure', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h2 style={{ color: '#4285F4' }}>Authenticating...</h2>
      <p>Securely logging you in...</p>
    </div>
  );
}