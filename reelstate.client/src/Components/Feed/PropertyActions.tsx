// src/Components/Feed/PropertyActions.tsx
import React from 'react';

interface PropertyActionsProps {
    property: VideoCardProperty;
    isLiked: boolean;
    isLoading: boolean;
    onLikeToggle: (propertyId: string) => void;
    onCommentClick: (propertyId: string) => void;
}

const PropertyActions: React.FC<PropertyActionsProps> = ({
    property,
    isLiked,
    isLoading,
    onLikeToggle,
    onCommentClick
}) => {
    const handleShare = () => {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: 'Check out this property!',
                text: `${property.caption.substring(0, 50)}${property.caption.length > 50 ? '...' : ''}`,
                url: `${url}?property=${property.id}`
            }).catch(error => console.error('Error sharing:', error));
        } else {
            prompt('Copy this link to share:', `${url}?property=${property.id}`);
        }
    };

    return (
        <div className="flex flex-col items-center space-y-6 z-30">
            {/* User icon */}
            <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gray-200 shadow-md">
                    <img
                        src={property.avatarUrl}
                        alt={property.username}
                        className="w-full h-full object-cover"
                    />
                </div>
                <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {property.username}
                </span>
            </div>

            {/* Like button */}
            <div className="flex flex-col items-center">
                <button
                    onClick={() => onLikeToggle(property.id)}
                    disabled={isLoading}
                    className={`w-11 h-11 ${isLiked ? 'bg-red-50' : 'bg-white'} rounded-full shadow-md flex items-center justify-center transition-all hover:shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg
                            className={`w-5 h-5 ${isLiked ? 'text-red-500' : 'text-gray-700'}`}
                            fill={isLiked ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                </button>
                <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {property.likes}
                </span>
            </div>

            {/* Comment button */}
            <div className="flex flex-col items-center">
                <button
                    onClick={() => onCommentClick(property.id)}
                    className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:bg-blue-50 hover:shadow-lg"
                >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </button>
                <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                    {property.comments}
                </span>
            </div>

            {/* Share button */}
            <div className="flex flex-col items-center">
                <button
                    onClick={handleShare}
                    className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:bg-green-50 hover:shadow-lg"
                >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                </button>
                <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                    Share
                </span>
            </div>
        </div>
    );
};

export default PropertyActions;