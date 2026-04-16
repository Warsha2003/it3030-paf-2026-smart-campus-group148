// src/pages/AdminUsersPage.jsx
// Module E – Admin user management page

import React, { useEffect, useState, useCallback } from 'react';
import {
    getAllUsers,
    updateUserRoles,
    disableUser,
    enableUser,
} from '../api/userAdminApi';
import './AdminUsersPage.css';

const ALL_ROLES = ['USER', 'TECHNICIAN', 'MANAGER', 'ADMIN'];

const RoleBadge = ({ role }) => (
    <span className={`admin-role-badge role-${role.toLowerCase()}`}>{role}</span>
);

const AdminUsersPage = () => {
    const [users,      setUsers]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [page,       setPage]       = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [editingId,  setEditingId]  = useState(null);
    const [editRoles,  setEditRoles]  = useState([]);
    const [saving,     setSaving]     = useState(false);

    const fetchUsers = useCallback(async (p = 0) => {
        setLoading(true); setError('');
        try {
            const res  = await getAllUsers(p, 20);
            const data = res.data.data;
            setUsers(data.content);
            setTotalPages(data.totalPages);
            setPage(data.page);
        } catch {
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(0); }, [fetchUsers]);

    // ── Role editing ─────────────────────────────────────────────────────────
    const startEdit = (user) => {
        setEditingId(user.id);
        setEditRoles([...user.roles]);
    };

    const toggleRole = (role) => {
        setEditRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const saveRoles = async (userId) => {
        if (editRoles.length === 0) return alert('A user must have at least one role.');
        setSaving(true);
        try {
            const res = await updateUserRoles(userId, editRoles);
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? res.data.data : u))
            );
            setEditingId(null);
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to update roles.');
        } finally {
            setSaving(false);
        }
    };

    // ── Enable / Disable ─────────────────────────────────────────────────────
    const toggleEnabled = async (user) => {
        try {
            const res = user.enabled
                ? await disableUser(user.id)
                : await enableUser(user.id);
            setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? res.data.data : u))
            );
        } catch (e) {
            alert(e.response?.data?.message || 'Action failed.');
        }
    };

    return (
        <div className="admin-page">
            <h1 className="admin-page-title">User Management</h1>
            <p className="admin-page-sub">Manage roles and account status for all registered users.</p>

            {error && <div className="admin-error">{error}</div>}

            {loading ? (
                <p className="admin-loading">Loading users…</p>
            ) : (
                <>
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Roles</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id} className={!user.enabled ? 'row-disabled' : ''}>
                                        {/* User */}
                                        <td>
                                            <div className="admin-user-cell">
                                                <div className="admin-avatar">
                                                    {user.picture ? (
                                                        <img src={user.picture} alt={user.name}
                                                            referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <span>{user.name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="admin-user-name">{user.name}</p>
                                                    <p className="admin-user-email">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Roles */}
                                        <td>
                                            {editingId === user.id ? (
                                                <div className="role-edit-group">
                                                    {ALL_ROLES.map((r) => (
                                                        <label key={r} className="role-checkbox">
                                                            <input
                                                                type="checkbox"
                                                                checked={editRoles.includes(r)}
                                                                onChange={() => toggleRole(r)}
                                                            />
                                                            {r}
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="role-badges">
                                                    {user.roles?.map((r) => (
                                                        <RoleBadge key={r} role={r} />
                                                    ))}
                                                </div>
                                            )}
                                        </td>

                                        {/* Status */}
                                        <td>
                                            <span className={`status-badge ${user.enabled ? 'active' : 'inactive'}`}>
                                                {user.enabled ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>

                                        {/* Joined */}
                                        <td className="admin-date">
                                            {user.createdAt
                                                ? new Date(user.createdAt).toLocaleDateString()
                                                : '—'}
                                        </td>

                                        {/* Actions */}
                                        <td>
                                            <div className="admin-actions">
                                                {editingId === user.id ? (
                                                    <>
                                                        <button
                                                            className="btn-save"
                                                            onClick={() => saveRoles(user.id)}
                                                            disabled={saving}
                                                        >
                                                            {saving ? '…' : 'Save'}
                                                        </button>
                                                        <button
                                                            className="btn-cancel"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() => startEdit(user)}
                                                        >
                                                            Roles
                                                        </button>
                                                        <button
                                                            className={`btn-toggle ${user.enabled ? 'disable' : 'enable'}`}
                                                            onClick={() => toggleEnabled(user)}
                                                        >
                                                            {user.enabled ? 'Disable' : 'Enable'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="admin-pagination">
                            <button disabled={page === 0} onClick={() => fetchUsers(page - 1)}>
                                ← Prev
                            </button>
                            <span>Page {page + 1} / {totalPages}</span>
                            <button disabled={page + 1 >= totalPages} onClick={() => fetchUsers(page + 1)}>
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminUsersPage;