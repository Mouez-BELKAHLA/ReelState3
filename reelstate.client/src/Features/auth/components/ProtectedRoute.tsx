import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../../store/hooks';

interface ProtectedRouteProps {
    redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    redirectPath = '/login'
}) => {
    const { isAuthenticated, isLoading } = useAppSelector(state => state.auth);

    console.log("ProtectedRoute - Auth state:",
        isLoading ? "Loading" : (isAuthenticated ? "Authenticated" : "Not authenticated"));

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        console.log("Not authenticated - redirecting to:", redirectPath);
        return <Navigate to={redirectPath} replace />;
    }

    console.log("Authentication successful - rendering protected content");
    return <Outlet />;
};

export default ProtectedRoute;