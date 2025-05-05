import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Consolidated auth imports
import {
    AuthProvider,
    ProtectedRoute,
    Login,
    Register
} from './Features/auth';

// Feature imports
import { Dashboard } from './Features/dashboard';
import { NotFound } from './Features/core';
import { Feed, CreateVideoCard } from './Features/property';

// Shared component imports
import { Layout } from './shared';
const App: React.FC = () => {
    useEffect(() => {
        console.log("Current origin:", window.location.origin);
    }, []);

    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Routes with navbar */}
                    <Route element={<Layout />}>
                        <Route path="/feed" element={<Feed />} />

                        {/* NotFound page - moved here to include navbar */}
                        <Route path="*" element={<NotFound />} />

                        {/* Protected routes with navbar */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/create" element={<CreateVideoCard />} />
                            {/* Add more protected routes here */}
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
            </AuthProvider>
        </Router>
    );
};

export default App;