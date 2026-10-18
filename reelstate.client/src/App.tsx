import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/hooks';
import { setupAxiosInterceptors } from './store/middleware/authMiddleware';
import { store } from './store';

// Eagerly loaded: needed on the first screen
import { ProtectedRoute, Login, Register } from './Features/auth';
import { NotFound } from './Features/core';
import UnauthorizedPage from './Features/auth/Pages/UnauthorizedPage';
import { Layout } from './shared';

// Lazy loaded: each page is downloaded only when its route is opened
const Dashboard = lazy(() => import('./Features/dashboard').then(m => ({ default: m.Dashboard })));
const Feed = lazy(() => import('./Features/property').then(m => ({ default: m.Feed })));
const CreateVideoCard = lazy(() => import('./Features/property').then(m => ({ default: m.CreateVideoCard })));
const UserVideoFeed = lazy(() => import('./Features/property').then(m => ({ default: m.UserVideoFeed })));
const SearchResults = lazy(() => import('./Features/property/pages/SearchResults'));
const Profile = lazy(() => import('./Features/profile').then(m => ({ default: m.Profile })));
const Notification = lazy(() => import('./Features/notification').then(m => ({ default: m.Notification })));
const AdminDashboard = lazy(() => import('./Features/admin').then(m => ({ default: m.AdminDashboard })));

// Set up axios interceptors
setupAxiosInterceptors(store);

// Admin route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAppSelector(state => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const isAdmin = user?.roles?.includes('Admin');
    if (!isAdmin) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};

const PageLoader: React.FC = () => (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
    </div>
);

const App: React.FC = () => {
    return (
        <Router>
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
        </Router>
    );
};

export default App;