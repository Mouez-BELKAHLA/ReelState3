import React from 'react';

interface UserProfileProps {
    avatarUrl: string;
    username: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ avatarUrl, username }) => {
    return (
        <div className="flex flex-col items-center justify-center" style={{ height: '40px', width: '40px' }}>
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                <img
                    src={avatarUrl}
                    alt={username}
                    className="w-full h-full object-cover"
                />
            </div>
        </div>
    );
};

export default UserProfile;