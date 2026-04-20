/**
 * AdminUsersPage.jsx
 * Admin-only page — view all users and manage their roles.
 *
 * Layout: Sidebar (left) + content (right) — full-width, no top Navbar.
 *
 * Features:
 *   - Live table of all registered users
 *   - Role badge with colour coding
 *   - Role dropdown to change a user's role (with confirm dialog)
 *   - Toggle active / inactive status
 *   - Search / filter by name or email
 *   - Loading skeletons & empty state
 *   - Success / error toasts
 *
 * APIs used:
 *   GET /api/admin/users          → adminGetAllUsers()
 *   PUT /api/admin/users/{id}/roles → adminUpdateUserRole()
 *   PATCH /api/users/{id}/toggle-active → toggleUserActive() (existing)
 *
 * Member 4 – Admin User Management Page
 */

import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { adminGetAllUsers, adminUpdateUserRole } from '../services/adminApi';
import { toggleUserActive } from '../services/userApi';   // existing helper
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

/* ── constants ────────────────────────────────────────── */
const ROLES = ['USER', 'ADMIN', 'TECHNICIAN'];

const ROLE_STYLES = {
  ADMIN:      { bg: '#fee2e2', text: '#dc2626' },
  TECHNICIAN: { bg: '#fef3c7', text: '#d97706' },
  USER:       { bg: '#d1fae5', text: '#059669' },
};

/* ── component ────────────────────────────────────────── */
export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  /* Load users on mount */
  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminGetAllUsers();
      if (res.success) setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users. Make sure you are logged in as ADMIN.');
    } finally {
      setLoading(false);
    }
  };

  /* Change role */
  const handleRoleChange = async (userId, newRole, userName) => {
    if (!window.confirm(`Change ${userName}'s role to ${newRole}?`)) return;
    setUpdatingId(userId);
    try {
      const res = await adminUpdateUserRole(userId, newRole);
      if (res.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
        toast.success(`${userName}'s role updated to ${newRole}.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role.');
    } finally {
      setUpdatingId(null);
    }
  };

  /* Toggle active/inactive */
  const handleToggleActive = async (userId, userName, currentActive) => {
    const action = currentActive ? 'deactivate' : 'activate';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${userName}?`)) return;
    setUpdatingId(userId);
    try {
      const res = await toggleUserActive(userId);
      if (res.success) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, active: !currentActive } : u));
        toast.success(`${userName} has been ${action}d.`);
      }
    } catch {
      toast.error('Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  /* Search filter */
  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-layout">
      <Sidebar />

      <main className="adm-content">

        {/* ── Page header ────────────────── */}
        <header className="adm-page-header">
          <div>
            <h1 className="adm-page-header__title">👥 User Management</h1>
            <p className="adm-page-header__sub">
              {users.length} registered user{users.length !== 1 ? 's' : ''} in the system
            </p>
          </div>
          <div className="adm-page-header__actions">
            <button className="btn btn--ghost" onClick={fetchUsers} title="Refresh">
              🔄 Refresh
            </button>
          </div>
        </header>

        {/* ── Search bar ─────────────────── */}
        <div className="adm-search-bar">
          <span className="adm-search-bar__icon">🔍</span>
          <input
            id="user-search"
            type="text"
            placeholder="Search by name or email…"
            className="adm-search-bar__input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="adm-search-bar__clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result count */}
        {!loading && (
          <p className="adm-results-count">
            Showing <strong>{filtered.length}</strong> of {users.length} users
          </p>
        )}

        {/* ── Content ────────────────────── */}
        {loading ? (
          <div className="skeleton-list">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-item" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">👥</span>
            <h3>No users found</h3>
            <p>Try a different search term.</p>
          </div>
        ) : (
          <div className="adm-table-wrapper">
            <table className="adm-table" aria-label="Users table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Auth Provider</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const roleStyle   = ROLE_STYLES[u.role] || ROLE_STYLES.USER;
                  const isSelf      = u.id === currentUser?.id;
                  const isUpdating  = updatingId === u.id;

                  return (
                    <tr
                      key={u.id}
                      id={`user-row-${u.id}`}
                      className={`adm-table__row
                        ${isSelf       ? 'adm-table__row--self'     : ''}
                        ${!u.active    ? 'adm-table__row--inactive'  : ''}`}
                    >
                      {/* Avatar + name */}
                      <td>
                        <div className="adm-user-cell">
                          <img
                            src={u.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=6366f1&color=fff&size=40`}
                            alt={u.name || 'User Avatar'}
                            className="adm-user-cell__avatar"
                            onError={(e) => {
                              // Fallback if ui-avatars fails
                              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Crect fill='%236366f1' width='40' height='40'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Arial' font-size='16' fill='%23fff'%3E${(u.name || 'U').charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                            }}
                          />
                          <div>
                            <p className="adm-user-cell__name">{u.name}</p>
                            {isSelf && <span className="adm-user-cell__you">(You)</span>}
                          </div>
                        </div>
                      </td>

                      <td className="adm-table__cell-email">{u.email}</td>

                      {/* Auth provider */}
                      <td>
                        <span className="adm-provider-badge">
                          {u.authProvider === 'GOOGLE' ? '🔑 Google' : u.authProvider}
                        </span>
                      </td>

                      {/* Role badge + dropdown */}
                      <td>
                        <div className="adm-role-cell">
                          <span
                            className="role-badge"
                            style={{ background: roleStyle.bg, color: roleStyle.text }}
                          >
                            {u.role}
                          </span>
                          {!isSelf && (
                            <select
                              id={`role-select-${u.id}`}
                              className="adm-role-select"
                              value={u.role}
                              disabled={isUpdating}
                              onChange={(e) => handleRoleChange(u.id, e.target.value, u.name)}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Active status */}
                      <td>
                        <span className={`status-badge ${u.active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                          {u.active ? '● Active' : '○ Inactive'}
                        </span>
                      </td>

                      {/* Joined date */}
                      <td className="adm-table__cell-time">{formatDate(u.createdAt)}</td>

                      {/* Actions */}
                      <td>
                        {!isSelf && (
                          <button
                            id={`toggle-active-${u.id}`}
                            className={`btn btn--sm ${u.active ? 'btn--danger-ghost' : 'btn--success-ghost'}`}
                            disabled={isUpdating}
                            onClick={() => handleToggleActive(u.id, u.name, u.active)}
                          >
                            {isUpdating ? '…' : u.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="adm-footer">
          Smart Campus Admin Panel &nbsp;·&nbsp; User Management
        </footer>
      </main>
    </div>
  );
}
