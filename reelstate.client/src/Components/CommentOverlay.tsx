import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../Hooks/useAuth';
import CommentService from '../Services/CommentService'; // Import the service

export type Comment = {
    id: string;
    userId: string;
    username: string;
    avatarUrl: string;
    text: string;
    createdAt: string;
};

type CommentOverlayProps = {
    propertyId: string;
    isVisible: boolean;
    onClose: () => void;
    onCommentCountUpdate?: (count: number) => void; // Add callback for updating comment count
};

const CommentOverlay: React.FC<CommentOverlayProps> = ({
    propertyId,
    isVisible,
    onClose,
    onCommentCountUpdate
}) => {
    const { authState } = useAuth();

    const [commentsList, setCommentsList] = useState<Comment[]>([]);
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const commentInputRef = useRef<HTMLInputElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Focus input when comments are shown
    useEffect(() => {
        if (isVisible && commentInputRef.current) {
            setTimeout(() => {
                commentInputRef.current?.focus();
            }, 300);
        }
    }, [isVisible]);

    // Fetch comments when overlay becomes visible
    useEffect(() => {
        if (isVisible && propertyId) {
            fetchComments();
        }
    }, [isVisible, propertyId]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isVisible, onClose]);

    const fetchComments = async () => {
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
        } catch (error: any) {
            console.error("Error fetching comments:", error);
            setError("Failed to load comments. Please try again.");
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim() || !authState.isAuthenticated || !propertyId) {
            return;
        }

        setError(null);
        setIsSubmittingComment(true);

        try {
            console.log("Submitting comment:", { propertyId, text: commentText });

            const newComment = await CommentService.addComment(propertyId, commentText.trim());

            if (newComment) {
                console.log("Comment added successfully:", newComment);

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

    return (
        <div
            ref={overlayRef}
            className={`absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col z-30 transition-transform duration-300 ease-out
                ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Comments header */}
            <div className="flex justify-between items-center p-4 border-b border-white/20">
                <h3 className="text-white font-medium">Comments ({commentsList.length})</h3>
                <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Error message if present */}
            {error && (
                <div className="bg-red-500/20 border border-red-400 text-white px-4 py-2 mt-2 mx-4 rounded">
                    {error}
                </div>
            )}

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4">
                {isCommentsLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                ) : commentsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/70">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No comments yet</p>
                        <p className="text-sm mt-1">Be the first to comment!</p>
                    </div>
                ) : (
                    <ul className="space-y-4">
                        {commentsList.map(comment => (
                            <li key={comment.id} className="flex space-x-3">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                    <img src={comment.avatarUrl} alt={comment.username} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="bg-white/10 rounded-xl p-3">
                                        <p className="text-white text-sm font-medium mb-1">{comment.username}</p>
                                        <p className="text-white text-sm">{comment.text}</p>
                                    </div>
                                    <div className="flex space-x-4 mt-1 px-2">
                                        <span className="text-white/60 text-xs">
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </span>
                                        <button className="text-white/60 text-xs hover:text-white">Like</button>
                                        <button className="text-white/60 text-xs hover:text-white">Reply</button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Comment input */}
            <div className="p-4 border-t border-white/20">
                {authState.isAuthenticated ? (
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img
                                src={authState.user?.profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'}
                                alt="Your Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <form
                            className="flex-1 flex items-center bg-white/10 rounded-full overflow-hidden"
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
                                placeholder="Add a comment..."
                                className="flex-1 bg-transparent text-white px-4 py-2 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim() || isSubmittingComment}
                                className={`px-4 py-2 ${!commentText.trim() || isSubmittingComment
                                        ? 'text-white/40'
                                        : 'text-blue-400 hover:text-blue-300'
                                    }`}
                            >
                                {isSubmittingComment ? (
                                    <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                                ) : (
                                    'Post'
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-white/10 rounded-xl p-4 text-center">
                        <p className="text-white mb-2">Please log in to comment</p>
                        <a
                            href="/login"
                            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                            Log In
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentOverlay;