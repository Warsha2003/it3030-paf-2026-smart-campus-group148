// src/components/layout/Navbar.jsx
// Shared navigation bar used across all authenticated pages

import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';
import './Navbar.css';

/**
 * Top navigation bar.
 *
 * Contains:
 *  - Brand logo / home link
 *  - Main nav links (role-sensitive)
 *  - NotificationBell (Module D)
 *  - User avatar + dropdown menu with logout
 */
const Navbar = () => {
    const { user, logout, hasRole, isAuthenticated } = useAuth();
    const navigate   = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef    = useRef(null);

    // Close avatar menu on outside click
    useEffect(() => {
        const handleOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    const handleLogout = async () => {
        setMenuOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    if (!isAuthenticated) return null;

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            {/* Left – brand */}
            <Link to="/dashboard" className="navbar-brand">
                <span aria-hidden="true">🏛️</span>
                <span>Smart Campus</span>
            </Link>

            {/* Centre – nav links */}
            <ul className="navbar-links" role="list">
                <li>
                    <NavLink to="/resources"
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Resources
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/bookings"
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Bookings
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/tickets"
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                        Tickets
                    </NavLink>
                </li>
                {/* Admin-only link */}
                {hasRole('ADMIN') && (
                    <li>
                        <NavLink to="/admin"
                            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                            Admin
                        </NavLink>
                    </li>
                )}
            </ul>

            {/* Right – notification bell + user menu */}
            <div className="navbar-right">
                {/* Module D – Notification Bell */}
                <NotificationBell />

                {/* User avatar dropdown */}
                <div className="user-menu-container" ref={menuRef}>
                    <button
                        className="user-avatar-btn"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="User menu"
                        aria-expanded={menuOpen}
                        aria-haspopup="true"
                    >
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt={user.name}
                                className="user-avatar-img"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <span className="user-avatar-fallback">
                                {user?.name?.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </button>

                    {menuOpen && (
                        <div className="user-dropdown" role="menu">
                            {/* User info */}
                            <div className="user-dropdown-info">
                                <p className="user-dropdown-name">{user?.name}</p>
                                <p className="user-dropdown-email">{user?.email}</p>
                                <div className="user-dropdown-roles">
                                    {user?.roles?.map((role) => (
                                        <span key={role} className={`role-badge role-${role.toLowerCase()}`}>
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <hr className="user-dropdown-divider" />
                            {/* Actions */}
                            <Link
                                to="/notifications"
                                className="user-dropdown-item"
                                role="menuitem"
                                onClick={() => setMenuOpen(false)}
                            >
                                🔔 All Notifications
                            </Link>
                            <button
                                className="user-dropdown-item user-dropdown-logout"
                                onClick={handleLogout}
                                role="menuitem"
                            >
                                🚪 Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;