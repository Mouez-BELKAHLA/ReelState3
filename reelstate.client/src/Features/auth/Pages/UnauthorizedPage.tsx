import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>

                <h1 className="mt-4 text-xl font-bold text-gray-900">Unauthorized Access</h1>
                <p className="mt-2 text-gray-600">
                    You don't have permission to access this page. This area is restricted to admin users only.
                </p>

                <div className="mt-6">
                    <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                        Go to Home Page
                    </Link>
                </div>
            </div>
        </div>
    );
};

export { UnauthorizedPage }; // Named export
export default UnauthorizedPage; // Default export