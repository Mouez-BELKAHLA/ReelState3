import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch } from './store/hooks';
import { setupAxiosInterceptors } from './store/middleware/authMiddleware';
import { store } from './store';

// Feature imports
import { ProtectedRoute, Login, Register } from './Features/auth';
import { Dashboard } from './Features/dashboard';
import { NotFound } from './Features/core';
import { Feed, CreateVideoCard, UserVideoFeed } from './Features/property';
import { Profile } from './Features/profile';
import { Notification } from './Features/notification'; // Importing Notification (singular)

// Shared component imports
import { Layout } from './shared';

// Set up axios interceptors
setupAxiosInterceptors(store);

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
                    <Route path="/user-videos/:userId" element={<UserVideoFeed />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="*" element={<NotFound />} />

                    {/* Protected routes with navbar */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/create" element={<CreateVideoCard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/notifications" element={<Notification />} /> {/* Use Notification (singular) to match the import */}
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