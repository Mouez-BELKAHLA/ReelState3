import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from "../../../Features/auth";
import { CommentService } from "../../../Features/property";

// Comment Type Definition
export type Comment = {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    text: string;
    createdAt: string;
};

// Props for CommentPanel
type CommentPanelProps = {
    propertyId: string;
    onClose: () => void;
    onCommentCountUpdate?: (count: number) => void;
    displayMode?: 'sidebar' | 'modal';
};

const CommentPanel: React.FC<CommentPanelProps> = ({
    propertyId,
    onClose,
    onCommentCountUpdate,
    displayMode = 'sidebar',
}) => {
    const { authState, loginWithRedirect } = useAuth();
    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const commentsListRef = useRef<HTMLDivElement>(null);

    // Fetch comments when component mounts
    const fetchComments = useCallback(async () => {
        if (!propertyId) return;

        setError(null);
        setIsCommentsLoading(true);

        try {
            const comments = await CommentService.getPropertyComments(propertyId);
            setCommentsList(comments as Comment[]);

            if (onCommentCountUpdate) {
                onCommentCountUpdate(comments.length);
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
            setError("Failed to load comments. Please try again.");
        } finally {
            setIsCommentsLoading(false);
        }
    }, [propertyId, onCommentCountUpdate]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    // Make sure the comment panel is fully visible when mounted
    useEffect(() => {
        // Scroll to make sure the comment input is visible after a slight delay
        const timer = setTimeout(() => {
            if (commentInputRef.current) {
                commentInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !authState.isAuthenticated || !propertyId) {
            return;
        }

        setError(null);
        setIsSubmittingComment(true);

        try {
            const newComment = await CommentService.addComment(propertyId, commentText.trim());

            if (newComment) {
                setCommentsList((prevComments) => [newComment, ...prevComments]);
                if (onCommentCountUpdate) {
                    onCommentCountUpdate(commentsList.length + 1);
                }
                setCommentText('');
            } else {
                setError("Failed to post comment. Please try again.");
            }
        } catch (err) {
            console.error("Error submitting comment:", err);
            setError("Failed to post comment. Please try again.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const getCommentCountDisplay = () => {
        if (commentsList.length >= 1000) {
            return `${(commentsList.length / 1000).toFixed(1)} k`;
        }
        return commentsList.length.toString();
    };

    // Handle login button click
    const handleLogin = () => {
        // Check if loginWithRedirect is available in your auth context
        if (loginWithRedirect) {
            loginWithRedirect();
        } else {
            // Fallback to redirect to login page
            window.location.href = '/login';
        }
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

            {/* Comments list - explicitly set height to ensure it doesn't push input off screen */}
            <div
                ref={commentsListRef}
                className="flex-1 overflow-y-auto"
                style={{
                    msOverflowStyle: 'none',
                    scrollbarWidth: 'none',
                    maxHeight: displayMode === 'modal' ? 'calc(70vh - 130px)' : 'calc(100vh - 170px)'
                }}
            >
                <style>{`
                  div::-webkit-scrollbar {
                    display: none;
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
                        {commentsList.map((comment) => (
                            <li key={comment.id} className="px-4 py-2 hover:bg-gray-50">
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                        <img src={comment.avatarUrl} alt={comment.username} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-x-2">
                                            <span className="text-gray-900 text-sm font-medium">@{comment.username}</span>
                                            <span className="text-gray-500 text-xs">il y a 1 mois</span>
                                        </div>
                                        <p className="text-gray-700 text-sm mt-1">{comment.text}</p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Comment input area - this is critical to fix */}
            <div className="p-4 border-t border-gray-200 bg-white">
                {authState.isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img
                                src={authState.user?.profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                                alt="User Profile"
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
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${!commentText.trim() || isSubmittingComment
                                    ? 'text-gray-400 cursor-not-allowed'
                                    : 'text-blue-500 hover:text-blue-600 hover:bg-gray-200'
                                    }`}
                            >
                                <span>Submit</span>
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="text-center py-3 px-4 flex flex-col items-center">
                        <p className="text-gray-600 mb-3">Connectez-vous pour commenter</p>
                        <button
                            onClick={handleLogin}
                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                        >
                            Se connecter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentPanel;