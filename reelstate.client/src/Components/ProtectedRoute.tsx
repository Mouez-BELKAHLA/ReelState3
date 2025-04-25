import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../Hooks/useAuth';
interface ProtectedRouteProps {
    redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    redirectPath = '/login'
}) => {
    const { authState } = useAuth();

    console.log("ProtectedRoute - Auth state:",
        authState.isLoading ? "Loading" : (authState.isAuthenticated ? "Authenticated" : "Not authenticated"));

    if (authState.isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!authState.isAuthenticated) {
        console.log("Not authenticated - redirecting to:", redirectPath);
        return <Navigate to={redirectPath} replace />;
    }

    console.log("Authentication successful - rendering protected content");
    return <Outlet />;
};

export default ProtectedRoute;