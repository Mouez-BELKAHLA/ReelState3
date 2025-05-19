import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { FollowerActivity } from '../types/UserActivity';

interface FollowersActivityProps {
    followers: {
        total: number;
        recent: FollowerActivity[];
    };
}

const FollowersActivity: React.FC<FollowersActivityProps> = ({ followers }) => {
    // Default avatar for users without profile pictures
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDggNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";

    if (followers.recent.length === 0) {
        return (
            <div className="p-4 bg-white rounded-lg shadow text-center">
                <div className="text-gray-500">
                    <p>You don't have any followers yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2">
                <h3 className="text-lg font-medium text-white">
                    Followers
                    <span className="ml-2 text-sm bg-white/20 rounded-full px-2 py-0.5">
                        {followers.total}
                    </span>
                </h3>
            </div>

            <div className="divide-y divide-gray-100">
                {followers.recent.map((follow) => (
                    <div key={follow.id} className="flex items-center p-3 hover:bg-green-50">
                        <Link
                            to={`/profile/${follow.followerUserId}`}
                            className="flex items-center flex-grow"
                        >
                            <div className="flex-shrink-0 mr-3">
                                <img
                                    src={follow.followerProfilePicture || defaultAvatar}
                                    alt={follow.followerUsername}
                                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = defaultAvatar;
                                    }}
                                />
                            </div>
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {follow.followerUsername}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Followed you {formatDistanceToNow(new Date(follow.createdAt))} ago
                                </p>
                            </div>
                        </Link>

                        <Link
                            to={`/profile/${follow.followerUserId}`}
                            className="text-xs text-green-600 hover:text-green-800 px-2 py-1 border border-green-200 rounded-md hover:bg-green-50"
                        >
                            View Profile
                        </Link>
                    </div>
                ))}
            </div>

            {followers.total > followers.recent.length && (
                <div className="p-3 text-center">
                    <span className="text-sm text-gray-500">
                        And {followers.total - followers.recent.length} more...
                    </span>
                </div>
            )}
        </div>
    );
};

export default FollowersActivity;