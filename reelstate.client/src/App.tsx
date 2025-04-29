import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './Contexts/AuthProvider';
import ProtectedRoute from './Components/ProtectedRoute';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Dashboard from './Pages/Dashboard';
import NotFound from './Pages/NotFound';
import Feed from './Pages/Feed';
import CreateVideoCard from './Pages/CreateVideoCard';

const App: React.FC = () => {
    useEffect(() => {
        console.log("Current origin:", window.location.origin);
    }, []);

    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/feed" element={<Feed />} />

                    {/* Protected routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/create" element={<CreateVideoCard />} />
                        {/* Add more protected routes here */}
                    </Route>

                    {/* Redirect root to feed as a public page */}
                    <Route path="/" element={<Navigate to="/feed" replace />} />

                    {/* 404 route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

export default App;