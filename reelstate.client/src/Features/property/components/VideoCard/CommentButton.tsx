import React from 'react';

interface CommentButtonProps {
    count: number;
    onClick: (e: React.MouseEvent) => void;
}

const CommentButton: React.FC<CommentButtonProps> = ({ count, onClick }) => {
    return (
        <div className="flex flex-col items-center" style={{ height: '48px', width: '34px' }}>
            <button
                onClick={onClick}
                className="backdrop-blur-lg rounded-full p-1.5 transition-all border border-white/20 flex items-center justify-center bg-transparent hover:bg-blue-500/30"
                style={{ width: '34px', height: '34px' }}
            >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>
            <span className="text-white text-xs font-medium mt-2">{count.toLocaleString()}</span>
        </div>
    );
};

export default CommentButton;