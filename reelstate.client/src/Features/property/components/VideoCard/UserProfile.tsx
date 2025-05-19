import React from 'react';
import { Link } from 'react-router-dom';

interface UserProfileProps {
    avatarUrl: string;
    username: string;
    userId?: string;
    onClick?: (e: React.MouseEvent) => void;
    linkToProfile?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({
    avatarUrl,
    username,
    userId,
    onClick,
    linkToProfile = false
}) => {
    // Default avatar fallback
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDggNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            onClick(e);
        }
        // Add debugging logs
        console.log(`Profile clicked for user ID: ${userId}`);
    };

    const profileContent = (
        <div
            className={`flex flex-col items-center justify-center ${onClick || linkToProfile ? 'cursor-pointer' : ''}`}
            style={{ height: '40px', width: '40px' }}
            onClick={handleClick}
        >
            <div className={`w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200 ${onClick || linkToProfile ? 'hover:border-blue-400 hover:shadow-md transition-all' : ''}`}>
                <img
                    src={avatarUrl || defaultAvatar}
                    alt={username}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultAvatar;
                    }}
                />
            </div>
        </div>
    );

    // If linkToProfile is true and we have a userId, wrap in Link component
    if (linkToProfile && userId) {
        return (
            <Link
                to={`/profile/${userId}`}
                onClick={(e) => {
                    e.stopPropagation();
                    console.log(`Navigating to profile: ${userId}`);
                }}
                title={`View ${username}'s profile`}
            >
                {profileContent}
            </Link>
        );
    }

    // Otherwise just return the profile content
    return profileContent;
};

export default UserProfile;