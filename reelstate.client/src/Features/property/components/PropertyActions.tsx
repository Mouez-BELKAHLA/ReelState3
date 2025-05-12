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
        <div className="flex flex-col items-center space-y-6">
            {/* Like Button */}
            <button
                onClick={onLikeToggle}
                className={`flex flex-col items-center ${isLiked ? 'text-red-500' : 'text-white'}`}
                disabled={isLoading}
            >
                <div className="bg-black/30 backdrop-blur-lg rounded-full p-3 border border-white/20 hover:bg-white/20 transition-all">
                    {isLoading ? (
                        <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                        <svg
                            className="w-8 h-8"
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
                </div>
                <span className="text-white text-sm mt-1">{property.likes?.toLocaleString() || 0}</span>
            </button>

            {/* Comment Button */}
            <button
                onClick={onCommentClick}
                className="flex flex-col items-center text-white"
            >
                <div className="bg-black/30 backdrop-blur-lg rounded-full p-3 border border-white/20 hover:bg-white/20 transition-all">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                    </svg>
                </div>
                <span className="text-white text-sm mt-1">{property.comments?.toLocaleString() || 0}</span>
            </button>

            {/* Share Button */}
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
                className="flex flex-col items-center text-white"
            >
                <div className="bg-black/30 backdrop-blur-lg rounded-full p-3 border border-white/20 hover:bg-white/20 transition-all">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                    </svg>
                </div>
                <span className="text-white text-sm mt-1">Share</span>
            </button>
        </div>
    );
};

export default PropertyActions;