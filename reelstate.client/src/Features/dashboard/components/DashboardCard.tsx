// src/Components/Dashboard/DashboardCard.tsx
import React from 'react';

interface DashboardCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    linkText?: string;
    linkUrl?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, label, value, linkText, linkUrl }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    {icon}
                </div>
                <div className="ml-5">
                    <div className="text-sm font-medium text-gray-500">{label}</div>
                    <div className="text-lg font-semibold">{value}</div>
                </div>
            </div>
        </div>
        {linkText && linkUrl && (
            <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                    <a href={linkUrl} className="font-medium text-blue-700 hover:text-blue-900">
                        {linkText}
                    </a>
                </div>
            </div>
        )}
    </div>
);

export default DashboardCard;