import React from 'react';
import { VideoCardProperty } from '../types/Property';

interface PropertyActionsProps {
    property: VideoCardProperty;
    isLiked: boolean;
    isLoading: boolean;
    onLikeToggle: () => void;
    onCommentClick: () => void;
}

const PropertyActions: React.FC<PropertyActionsProps> = ({
    property,
    isLiked,
    isLoading,
    onLikeToggle,
    onCommentClick
}) => {
    return (
        <div className="flex flex-col items-center space-y-4">
            {/* Like Button */}
            <div className="flex flex-col items-center">
                <button
                    onClick={onLikeToggle}
                    className={`flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 shadow-sm hover:bg-gray-300 transition-colors`}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg
                            className={`w-6 h-6 ${isLiked ? 'text-red-500' : 'text-gray-700'}`}
                            fill={isLiked ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    )}
                </button>
                <span className="text-sm mt-1 text-center">{property.likes?.toLocaleString() || 0}</span>
            </div>

            {/* Comment Button */}
            <div className="flex flex-col items-center">
                <button
                    onClick={onCommentClick}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 shadow-sm hover:bg-gray-300 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </button>
                <span className="text-sm mt-1 text-center">{property.comments?.toLocaleString() || 0}</span>
            </div>

            {/* Share Button */}
            <div className="flex flex-col items-center">
                <button
                    onClick={() => {
                        navigator.share?.({
                            title: property.title || 'Check out this property!',
                            text: property.caption || 'Great property listing I found',
                            url: `/feed?property=${property.id}`
                        }).catch(() => {
                            // Fallback if Web Share API fails
                            navigator.clipboard?.writeText(window.location.origin + `/feed?property=${property.id}`)
                                .then(() => alert('Link copied to clipboard!'))
                                .catch(() => console.error('Failed to copy link'));
                        });
                    }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 shadow-sm hover:bg-gray-300 transition-colors"
                >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                    </svg>
                </button>
                <span className="text-sm mt-1 text-center">Partager</span>
            </div>

            {/* More Options Button */}
            <div className="flex flex-col items-center">
                <button className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 shadow-sm hover:bg-gray-300 transition-colors">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                    </svg>
                </button>
            </div>

            {/* User Profile Picture */}
            <div className="mt-2">
                <div className="w-10 h-10 rounded-full border border-gray-300 overflow-hidden">
                    <img
                        src={property.avatarUrl || "https://via.placeholder.com/40"}
                        alt={property.username || "User"}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
};

export default PropertyActions;