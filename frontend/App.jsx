// src/App.jsx
// Root component – wires AuthProvider, routing and all route guards

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth components (Module E)
import Login                from './components/auth/Login';
import OAuthRedirectHandler from './components/auth/OAuthRedirectHandler';
import PrivateRoute         from './components/auth/PrivateRoute';
import RoleRoute            from './components/auth/RoleRoute';

// Layout
import Navbar from './components/layout/Navbar';

// Pages
import NotificationsPage from './pages/NotificationsPage';
import AdminUsersPage    from './pages/AdminUsersPage';

// ── Placeholder pages (implemented by other team members) ────────────────────
const Dashboard       = () => <div style={{ padding: '2rem' }}><h2>Dashboard</h2></div>;
const ResourcesPage   = () => <div style={{ padding: '2rem' }}><h2>Resources (Module A)</h2></div>;
const BookingsPage    = () => <div style={{ padding: '2rem' }}><h2>Bookings (Module B)</h2></div>;
const TicketsPage     = () => <div style={{ padding: '2rem' }}><h2>Tickets (Module C)</h2></div>;
const UnauthorizedPage = () => (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>403 – Forbidden</h2>
        <p>You do not have permission to access this page.</p>
    </div>
);
const NotFoundPage = () => (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>404 – Page Not Found</h2>
    </div>
);

// ── Layout wrapper for authenticated pages ────────────────────────────────────
const AuthenticatedLayout = ({ children }) => (
    <>
        <Navbar />
        <main>{children}</main>
    </>
);

const App = () => (
    <BrowserRouter>
        <AuthProvider>
            <Routes>
                {/* ── Public routes ─────────────────────────────────────────── */}
                <Route path="/login"            element={<Login />} />
                <Route path="/oauth2/redirect"  element={<OAuthRedirectHandler />} />
                <Route path="/unauthorized"     element={<UnauthorizedPage />} />

                {/* ── Authenticated routes ───────────────────────────────────── */}
                <Route element={<PrivateRoute />}>
                    {/* Default redirect */}
                    <Route index element={<Navigate to="/dashboard" replace />} />

                    <Route
                        path="/dashboard"
                        element={<AuthenticatedLayout><Dashboard /></AuthenticatedLayout>}
                    />
                    <Route
                        path="/resources"
                        element={<AuthenticatedLayout><ResourcesPage /></AuthenticatedLayout>}
                    />
                    <Route
                        path="/bookings"
                        element={<AuthenticatedLayout><BookingsPage /></AuthenticatedLayout>}
                    />
                    <Route
                        path="/tickets"
                        element={<AuthenticatedLayout><TicketsPage /></AuthenticatedLayout>}
                    />

                    {/* Module D – Notifications (accessible by all authenticated users) */}
                    <Route
                        path="/notifications"
                        element={<AuthenticatedLayout><NotificationsPage /></AuthenticatedLayout>}
                    />

                    {/* Module E – Admin panel (ADMIN role required) */}
                    <Route element={<RoleRoute roles={['ADMIN']} />}>
                        <Route
                            path="/admin"
                            element={<AuthenticatedLayout><AdminUsersPage /></AuthenticatedLayout>}
                        />
                    </Route>
                </Route>

                {/* ── Fallback ─────────────────────────────────────────────── */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AuthProvider>
    </BrowserRouter>
);

export default App;