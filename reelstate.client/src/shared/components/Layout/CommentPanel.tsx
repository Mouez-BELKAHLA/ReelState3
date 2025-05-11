import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from "../../../Features/auth";
import { CommentService } from "../../../Features/property";
import { CommentLikeService } from "../../../Features/property";
import { useNavigate } from 'react-router-dom'; // Add this import

// Comment Type Definition
export type Comment = {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    text: string;
    createdAt: string;
    parentCommentId?: string | null;
    replies?: Comment[];
    isLiked?: boolean;
    likesCount?: number;
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
    const { authState } = useAuth(); // Remove loginWithRedirect
    const navigate = useNavigate(); // Add navigate hook
    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const commentInputRef = useRef<HTMLInputElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const commentsListRef = useRef<HTMLDivElement>(null);

    // Count total comments including replies
    const countTotalComments = useCallback((comments: Comment[]): number => {
        let count = comments.length;
        for (const comment of comments) {
            if (comment.replies && comment.replies.length > 0) {
                count += countTotalComments(comment.replies);
            }
        }
        return count;
    }, []);

    // Fetch comments when component mounts
    const fetchComments = useCallback(async () => {
        if (!propertyId) return;

        setError(null);
        setIsCommentsLoading(true);

        try {
            const comments = await CommentService.getPropertyComments(propertyId);
            setCommentsList(comments as Comment[]);

            if (onCommentCountUpdate) {
                onCommentCountUpdate(countTotalComments(comments));
            }
        } catch (err) {
            console.error("Error fetching comments:", err);
            setError("Failed to load comments. Please try again.");
        } finally {
            setIsCommentsLoading(false);
        }
    }, [propertyId, onCommentCountUpdate, countTotalComments]);

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

    // Focus input when replying
    useEffect(() => {
        if (replyingTo && commentInputRef.current) {
            commentInputRef.current.focus();
        }
    }, [replyingTo]);

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !authState.isAuthenticated || !propertyId) {
            return;
        }

        setError(null);
        setIsSubmittingComment(true);

        try {
            const parentCommentId = replyingTo?.id;
            const newComment = await CommentService.addComment(propertyId, commentText.trim(), parentCommentId);

            if (newComment) {
                if (parentCommentId) {
                    // If it's a reply, update the comments list accordingly
                    const updatedComments = updateCommentsWithNewReply(commentsList, parentCommentId, newComment);
                    setCommentsList(updatedComments);
                } else {
                    // If it's a top-level comment
                    setCommentsList((prevComments) => [newComment, ...prevComments]);
                }

                if (onCommentCountUpdate) {
                    onCommentCountUpdate(countTotalComments([...commentsList, newComment]));
                }

                setCommentText('');
                setReplyingTo(null);
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

    // Helper to update comments tree with new reply
    const updateCommentsWithNewReply = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
        return comments.map(comment => {
            if (comment.id === parentId) {
                // Add reply to this comment
                return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply]
                };
            } else if (comment.replies && comment.replies.length > 0) {
                // Check in replies
                return {
                    ...comment,
                    replies: updateCommentsWithNewReply(comment.replies, parentId, newReply)
                };
            }
            return comment;
        });
    };

    const getCommentCountDisplay = () => {
        const total = countTotalComments(commentsList);
        if (total >= 1000) {
            return `${(total / 1000).toFixed(1)} k`;
        }
        return total.toString();
    };

    // Start replying to a comment
    const handleReply = (comment: Comment) => {
        if (!authState.isAuthenticated) {
            handleLogin();
            return;
        }

        setReplyingTo(comment);
        setCommentText(`@${comment.username} `);
    };

    // Cancel replying
    const cancelReply = () => {
        setReplyingTo(null);
        setCommentText('');
    };

    // Update handleLogin function
    const handleLogin = () => {
        navigate('/login'); // Use navigate instead of loginWithRedirect
    };

    // Recursive comment rendering component
    const CommentItem: React.FC<{ comment: Comment, level: number }> = ({ comment, level }) => {
        const maxLevel = 3; // Limit nesting levels
        const [isLiked, setIsLiked] = useState(comment.isLiked);
        const [likesCount, setLikesCount] = useState<number>(comment.likesCount || 0);
        const [isLiking, setIsLiking] = useState(false);

        const handleLikeToggle = async () => {
            if (!authState.isAuthenticated) {
                handleLogin();
                return;
            }

            try {
                setIsLiking(true);
                const result = await CommentLikeService.toggleLike(comment.id);
                setIsLiked(result.isLiked);
                setLikesCount(result.likesCount);
            } catch (err) {
                console.error("Error toggling like:", err);
            } finally {
                setIsLiking(false);
            }
        };

        return (
            <li className={`px-4 py-2 hover:bg-gray-50 ${level > 0 ? 'ml-' + (level * 4) : ''}`}>
                <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <img src={comment.avatarUrl || 'https://via.placeholder.com/32'}
                            alt={comment.username}
                            className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-baseline gap-x-2">
                            <span className="text-gray-900 text-sm font-medium">@{comment.username}</span>
                            <span className="text-gray-500 text-xs">
                                {new Date(comment.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <p className="text-gray-700 text-sm mt-1">{comment.text}</p>

                        <div className="flex items-center mt-1 space-x-4">
                            {/* Like button */}
                            <button
                                onClick={handleLikeToggle}
                                disabled={isLiking}
                                className={`flex items-center text-xs ${isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                                    }`}
                            >
                                <svg
                                    className={`w-4 h-4 mr-1 ${isLiking ? 'animate-pulse' : ''}`}
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
                                <span>{likesCount > 0 ? likesCount : ''}</span>
                            </button>

                            {/* Reply button */}
                            <button
                                onClick={() => handleReply(comment)}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Reply
                            </button>
                        </div>

                        {/* Nested replies */}
                        {comment.replies && comment.replies.length > 0 && (
                            <ul className="mt-2 space-y-2">
                                {comment.replies.map(reply => (
                                    <CommentItem
                                        key={reply.id}
                                        comment={reply}
                                        level={Math.min(level + 1, maxLevel)}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </li>
        );
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

            {/* Reply indicator */}
            {replyingTo && (
                <div className="bg-blue-50 px-4 py-2 flex justify-between items-center">
                    <span className="text-sm">
                        Replying to <span className="font-semibold">@{replyingTo.username}</span>
                    </span>
                    <button onClick={cancelReply} className="text-xs text-gray-500 hover:text-gray-700">
                        Cancel
                    </button>
                </div>
            )}

            {/* Comments list */}
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
                            <CommentItem key={comment.id} comment={comment} level={0} />
                        ))}
                    </ul>
                )}
            </div>

            {/* Comment input area */}
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
                                placeholder={replyingTo ? "Write a reply..." : "Ajouter un commentaire..."}
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
                                <span>{replyingTo ? "Reply" : "Submit"}</span>
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