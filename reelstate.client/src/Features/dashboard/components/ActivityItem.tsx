import React from 'react';
import { Link } from 'react-router-dom';

interface ActivityItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    date: string;
    link: string;
    image?: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ icon, title, subtitle, date, link, image }) => {
    // Function to ensure image path is absolute
    const getImageUrl = (path?: string) => {
        if (!path) return undefined;

        // If it's already a full URL (starts with http or https), use it as is
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // If it's a path starting with slash, it's relative to domain root
        if (path.startsWith('/')) {
            // Use current domain origin
            return `${window.location.origin}${path}`;
        }

        // Otherwise, assume it's relative to API base URL
        return `${window.location.origin}/${path}`;
    };

    return (
        <div className="flex items-center p-4 bg-white rounded-lg shadow mb-3 hover:bg-gray-50">
            <div className="flex-shrink-0 mr-4">
                {image ? (
                    <div className="w-16 h-16 rounded-md overflow-hidden">
                        <img
                            src={getImageUrl(image)}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback if image fails to load
                                e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image';
                            }}
                        />
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {icon}
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <Link to={link} className="text-sm font-medium text-gray-900 truncate hover:underline">
                    {title}
                </Link>
                <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
                {new Date(date).toLocaleDateString()}
            </div>
        </div>
    );
};

export default ActivityItem;