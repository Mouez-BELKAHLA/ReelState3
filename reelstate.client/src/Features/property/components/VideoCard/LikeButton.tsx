import React from 'react';

interface LikeButtonProps {
    isLiked: boolean;
    isLoading: boolean;
    count: number;
    onToggle: (e: React.MouseEvent) => void;
}

const LikeButton: React.FC<LikeButtonProps> = ({ isLiked, isLoading, count, onToggle }) => {
    return (
        <div className="flex flex-col items-center" style={{ height: '48px', width: '34px' }}>
            <button
                onClick={onToggle}
                disabled={isLoading}
                className={`backdrop-blur-lg rounded-full p-1.5 transition-all border flex items-center justify-center
          ${isLiked
                        ? 'bg-red-500/30 border-red-400 hover:bg-red-600/40'
                        : 'bg-transparent border-white/20 hover:bg-red-500/30'}`}
                style={{ width: '34px', height: '34px' }}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <svg
                        className={`w-5 h-5 ${isLiked ? 'text-red-400 fill-current' : 'text-white'}`}
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
            <span className="text-white text-xs font-medium mt-2">
                {isLoading ? '...' : count.toLocaleString()}
            </span>
        </div>
    );
};

export default LikeButton;