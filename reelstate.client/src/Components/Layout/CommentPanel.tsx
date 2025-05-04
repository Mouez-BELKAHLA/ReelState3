import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../Hooks/useAuth';
import CommentService from '../../Services/CommentService';

export type Comment = {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    text: string;
    createdAt: string;
};

type CommentPanelProps = {
    propertyId: string;
    onClose: () => void;
    onCommentCountUpdate?: (count: number) => void;
    isMobile?: boolean;
    displayMode?: 'sidebar' | 'modal'; // New prop to control display mode
};

const CommentPanel: React.FC<CommentPanelProps> = ({
    propertyId,
    onClose,
    onCommentCountUpdate,
    isMobile = false,
    displayMode = 'sidebar'
}) => {
    const { authState } = useAuth();
    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Animation state for entrance
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger entrance animation after mount
        setTimeout(() => {
            setIsVisible(true);
        }, 10);
    }, []);

    // Fetch comments when component mounts
    const fetchComments = useCallback(async () => {
        if (!propertyId) return;

        setError(null);
        setIsCommentsLoading(true);

        try {
            const comments = await CommentService.getPropertyComments(propertyId);
            setCommentsList(comments);

            // Update the comment count in parent component
            if (onCommentCountUpdate) {
                onCommentCountUpdate(comments.length);
            }
        } catch (error: unknown) {
            console.error("Error fetching comments:", error);
            setError("Failed to load comments. Please try again.");
        } finally {
            setIsCommentsLoading(false);
        }
    }, [propertyId, onCommentCountUpdate]);

    // Focus input on mount
    useEffect(() => {
        if (commentInputRef.current) {
            setTimeout(() => {
                commentInputRef.current?.focus();
            }, 300);
        }
    }, []);

    // Fetch comments on mount
    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Close on click outside for modal only
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (displayMode === 'modal' &&
                panelRef.current &&
                !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [displayMode, onClose]);

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !authState.isAuthenticated || !propertyId) {
            return;
        }

        setError(null);
        setIsSubmittingComment(true);

        try {
            const newComment = await CommentService.addComment(propertyId, commentText.trim());

            if (newComment) {
                // Add the new comment to the list
                setCommentsList(prevComments => [newComment, ...prevComments]);

                // Update the comment count in parent component
                if (onCommentCountUpdate) {
                    onCommentCountUpdate(commentsList.length + 1);
                }

                // Clear the input
                setCommentText('');
            } else {
                setError("Failed to post comment. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting comment:", error);
            setError("Failed to post comment. Please try again.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Get comment count display text
    const getCommentCountDisplay = () => {
        if (commentsList.length >= 1000) {
            return `${(commentsList.length / 1000).toFixed(1)} k`;
        }
        return commentsList.length.toString();
    };

    return (
        <div
            ref={panelRef}
            className={`flex flex-col h-full w-full bg-white ${displayMode === 'modal' ? '' : 'border-l border-gray-200'}`}
        >
            {/* Header with count and close button */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                <h3 className="text-gray-900 font-medium flex items-center">
                    Commentaires
                    <span className="ml-2 text-sm text-gray-500">{getCommentCountDisplay()}</span>
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close comments"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Error message if present */}
            {error && (
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 mt-2 mx-4 rounded">
                    {error}
                </div>
            )}

            {/* Comments list - Hide scrollbars */}
            <div className="flex-1 overflow-y-auto" style={{
                msOverflowStyle: 'none', /* IE and Edge */
                scrollbarWidth: 'none', /* Firefox */
            }}>
                {/* Add webkit scrollbar style */}
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none; /* Chrome, Safari, Opera */
                    }
                `}</style>

                {isCommentsLoading ? (
                    <div className="flex justify-center items-center py-10">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : commentsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-gray-500">
                        <p className="text-center">Pas de commentaires</p>
                        <p className="text-sm mt-1 text-center">Soyez le premier à commenter</p>
                    </div>
                ) : (
                    <ul className="py-2">
                        {commentsList.map(comment => (
                            <li key={comment.id} className="px-4 py-2 hover:bg-gray-50">
                                <div className="flex items-start space-x-3">
                                    {/* User avatar */}
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                        <img src={comment.avatarUrl} alt={comment.username} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Comment content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Username and date */}
                                        <div className="flex items-baseline flex-wrap gap-x-2">
                                            <span className="text-gray-900 text-sm font-medium">@{comment.username}</span>
                                            <span className="text-gray-500 text-xs">
                                                il y a {Math.floor(Math.random() * 4) + 1} mois
                                            </span>
                                        </div>

                                        {/* Comment text */}
                                        <p className="text-gray-700 text-sm mt-1">{comment.text}</p>

                                        {/* Actions */}
                                        <div className="flex items-center space-x-4 mt-2">
                                            <div className="flex items-center">
                                                <button className="text-gray-500 hover:text-gray-700 mr-1">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905v.714L7.5 9h-3a2 2 0 00-2 2v.5a2 2 0 002 2h.5a2 2 0 002-2v-.5z" />
                                                    </svg>
                                                </button>
                                                <span className="text-gray-500 text-xs">{Math.floor(Math.random() * 100) + 1}</span>
                                            </div>
                                            <button className="text-gray-500 hover:text-gray-700 text-xs">
                                                Répondre
                                            </button>
                                        </div>

                                        {/* Show replies - YouTube style */}
                                        {Math.random() > 0.5 && (
                                            <button className="flex items-center text-blue-600 text-xs mt-2">
                                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                {Math.floor(Math.random() * 20) + 1} réponses
                                            </button>
                                        )}
                                    </div>

                                    {/* Options button */}
                                    <button className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Comment input area */}
            <div className="p-4 border-t border-gray-200">
                {authState.isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img
                                src={authState.user?.profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                                alt="Your Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <form
                            className="flex-1 relative"
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSubmitComment();
                            }}
                        >
                            <input
                                ref={commentInputRef}
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Ajouter un commentaire..."
                                className="w-full bg-gray-100 text-gray-800 px-4 py-2 rounded-full outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || isSubmittingComment}
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full
                                    ${!commentText.trim() || isSubmittingComment
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-blue-500 hover:text-blue-600 hover:bg-gray-200'
                                    }`}
                            >
                                {isSubmittingComment ? (
                                    <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-gray-100 rounded-xl p-4 text-center">
                        <p className="text-gray-700 mb-2">Connectez-vous pour commenter</p>
                        <a
                            href="/login"
                            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            Se connecter
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentPanel;