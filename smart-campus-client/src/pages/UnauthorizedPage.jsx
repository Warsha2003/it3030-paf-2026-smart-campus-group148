/**
 * UnauthorizedPage.jsx
 * Shown when a user tries to access a page they don't have permission for.
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <div className="error-page">
      <div className="error-page__card">
        <span className="error-page__icon">🚫</span>
        <h1 className="error-page__code">403</h1>
        <h2 className="error-page__title">Access Denied</h2>
        <p className="error-page__msg">
          You don't have permission to view this page.
          {user && ` Your current role is <strong>${user.role}</strong>.`}
        </p>
        <Link to="/dashboard" className="btn btn--primary">← Back to Dashboard</Link>
      </div>
    </div>
  );
}
