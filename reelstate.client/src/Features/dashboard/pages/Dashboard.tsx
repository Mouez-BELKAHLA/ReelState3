import React from 'react';
import { useAppSelector } from "../../../store/hooks"; // Import Redux hooks
import { DashboardCard } from "..";

const Dashboard: React.FC = () => {
    // Replace useAuth with Redux selector
    const { user } = useAppSelector(state => state.auth);

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
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
                                <DashboardCard
                                    icon={
                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                    }
                                    label="PROPERTIES"
                                    value={0}
                                    linkText="VIEW ALL"
                                    linkUrl="#"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;