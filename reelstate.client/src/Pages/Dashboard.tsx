import React from 'react';
import { useAuth } from '../Hooks/useAuth';

const Dashboard: React.FC = () => {
    const { authState, logout } = useAuth();

    // Add debug log to see what's in authState
    console.log("Dashboard rendering, authState:", authState);

    // IMPORTANT: Use camelCase 'user' instead of PascalCase 'User'
    const { user } = authState;

    // Add more debugging
    console.log("user from authState:", user);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
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

            <main>
                <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
                            <h2 className="text-2xl font-bold mb-4">WELCOME TO YOUR DASHBOARD</h2>
                            <p className="text-gray-600">
                                You are now signed in to REELSTATE. This is your personal dashboard where you can manage your property listings,
                                view favorites, and track your activity.
                            </p>

                            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Dashboard cards would go here */}
                                <div className="bg-white overflow-hidden shadow rounded-lg">
                                    <div className="p-5">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                            </div>
                                            <div className="ml-5">
                                                <div className="text-sm font-medium text-gray-500">PROPERTIES</div>
                                                <div className="text-lg font-semibold">0</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-5 py-3">
                                        <div className="text-sm">
                                            <a href="#" className="font-medium text-blue-700 hover:text-blue-900">VIEW ALL</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;