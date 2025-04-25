import React, { useEffect } from 'react';
import { useAuth } from '../Hooks/useAuth';

const Dashboard: React.FC = () => {
    const { authState, logout } = useAuth();

    // Add these debug logs
    console.log("Dashboard rendering, authState:", authState);
    console.log("User in authState:", authState.user);

    const { user } = authState;

    useEffect(() => {
        console.log("Dashboard mounted with user:", user);
    }, [user]);

    if (!user) {
        console.log("User is null, showing loading state");
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Rest of your component unchanged */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">REELSTATE Dashboard</h1>
                    <div className="flex items-center gap-4">
                        {user.profilePictureUrl && (
                            <img
                                src={user.profilePictureUrl}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        )}
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                                {user.firstName.toUpperCase()} {user.lastName.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            LOGOUT
                        </button>
                    </div>
                </div>
            </header>

            {/* Rest of your component */}
        </div>
    );
};

export default Dashboard;