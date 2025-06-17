import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setupAxiosInterceptors } from './store/middleware/authMiddleware';
import { store } from './store';

// Feature imports
import { ProtectedRoute, Login, Register } from './Features/auth';
import { Dashboard } from './Features/dashboard';
import { NotFound } from './Features/core';
import { Feed, CreateVideoCard, UserVideoFeed } from './Features/property';
import SearchResults from './Features/property/pages/SearchResults';
import { Profile } from './Features/profile';
import { Notification } from './Features/notification';
import { AdminDashboard } from './Features/admin';
import UnauthorizedPage from './Features/auth/pages/UnauthorizedPage';

// Shared component imports
import { Layout } from './shared';

// Set up axios interceptors
setupAxiosInterceptors(store);

// Admin route component with debugging
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAppSelector(state => state.auth);

    useEffect(() => {
        console.log("AdminRoute check:", {
            isAuthenticated,
            user,
            roles: user?.roles,
            isAdmin: user?.roles?.includes('Admin')
        });
    }, [isAuthenticated, user]);

    if (!isAuthenticated) {
        console.log("Admin route: Not authenticated, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    // Check if user has Admin role
    const isAdmin = user?.roles?.includes('Admin');
    if (!isAdmin) {
        console.log("Admin route: Not admin, redirecting to unauthorized", user?.roles);
        return <Navigate to="/unauthorized" replace />;
    }

    console.log("Admin route: Authorized as admin");
    return <>{children}</>;
};

const App: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        console.log("Current origin:", window.location.origin);
    }, []);

    return (
        <Router>
            <Routes>
                {/* Routes with navbar */}
                <Route element={<Layout />}>
                    <Route path="/feed" element={<Feed />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/user-videos/:userId" element={<UserVideoFeed />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/unauthorized" element={<UnauthorizedPage />} />
                    <Route path="*" element={<NotFound />} />

                    {/* Protected routes with navbar */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/create" element={<CreateVideoCard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/notifications" element={<Notification />} />

                        {/* Admin route */}
                        <Route path="/admin" element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        } />
                    </Route>
                </Route>

                {/* Routes without navbar */}
                <Route element={<Layout hideNavbar />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                {/* Redirect root to feed as a public page */}
                <Route path="/" element={<Navigate to="/feed" replace />} />
            </Routes>
        </Router>
    );
};

export default App;