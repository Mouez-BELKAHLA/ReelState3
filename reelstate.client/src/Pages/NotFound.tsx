import React from 'react';
import { Link } from 'react-router-dom';

const NOT_FOUND: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-blue-700">404</h1>
                <h2 className="text-6xl font-medium py-8">PAGE NOT FOUND</h2>
                <p className="text-xl text-gray-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="px-6 py-3 bg-blue-700 text-white font-medium rounded-md hover:bg-blue-800 transition-colors"
                >
                    GO HOME
                </Link>
            </div>
        </div>
    );
};

export default NOT_FOUND;