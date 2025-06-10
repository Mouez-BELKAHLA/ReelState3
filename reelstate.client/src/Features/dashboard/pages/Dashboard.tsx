import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { fetchUserActivity } from "../../../store/slices/userActivitySlice";
import { ActivityItem } from "..";
import { Link } from 'react-router-dom';

// Updated to remove follow-related filter types
type FilterType = 'all' | 'liked-properties' | 'comments' | 'liked-comments';

const Dashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const { user } = useAppSelector(state => state.auth);
    const {
        comments,
        likes,
        likedComments,
        // removed following and followers from destructuring
        loading,
        error
    } = useAppSelector(state => state.userActivity);

    // State for active filter
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    // State for filter notification message
    const [filterMessage, setFilterMessage] = useState<string | null>(null);

    // Fixed the useEffect hook to properly fetch data once when user id is available
    useEffect(() => {
        if (user?.id) {
            dispatch(fetchUserActivity(user.id));
        }
    }, [dispatch, user]);

    // A separate useEffect just for logging if needed (optional)
    useEffect(() => {
        console.log("Dashboard state updated:");
    }, []); // Removed following and followers dependencies

    // Handle filter change
    const handleFilterChange = (filter: FilterType) => {
        setActiveFilter(filter);

        // Set notification message based on filter
        switch (filter) {
            case 'liked-properties':
                setFilterMessage("Showing only your liked properties");
                break;
            case 'comments':
                setFilterMessage("Showing only your comments");
                break;
            case 'liked-comments':
                setFilterMessage("Showing only your liked comments");
                break;
            default:
                setFilterMessage("Showing all activity");
        }

        // Clear message after 3 seconds
        setTimeout(() => {
            setFilterMessage(null);
        }, 3000);
    };

    // Retry loading activity data
    const handleRetry = () => {
        if (user?.id) {
            dispatch(fetchUserActivity(user.id));
        }
    };

    // Default avatar for users without profile pictures
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDggNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";

    if (!user) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    // Calculate total activity count (without following and followers)
    const totalActivityCount = (likes?.total || 0) +
        (comments?.total || 0) +
        (likedComments?.total || 0);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h1 className="text-2xl font-bold mb-6">Welcome, {user.displayName || user.email}</h1>

                        {/* Navigation-style filter bar */}
                        <div className="border-b border-gray-200">
                            <nav className="-mb-px flex space-x-8 overflow-x-auto pb-1">
                                <button
                                    onClick={() => handleFilterChange('all')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeFilter === 'all'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    All Activity
                                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100">
                                        {totalActivityCount}
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleFilterChange('liked-properties')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeFilter === 'liked-properties'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Liked Properties
                                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100">
                                        {likes?.total || 0}
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleFilterChange('comments')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeFilter === 'comments'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Comments Made
                                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100">
                                        {comments?.total || 0}
                                    </span>
                                </button>

                                <button
                                    onClick={() => handleFilterChange('liked-comments')}
                                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeFilter === 'liked-comments'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Liked Comments
                                    <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100">
                                        {likedComments?.total || 0}
                                    </span>
                                </button>
                            </nav>
                        </div>

                        {/* Filter notification message */}
                        {filterMessage && (
                            <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded-md text-sm transition-opacity duration-300">
                                {filterMessage}
                            </div>
                        )}

                        {/* Recent Activity Section */}
                        <div className="mt-6">
                            <h2 className="text-xl font-semibold mb-4">
                                {activeFilter === 'all'
                                    ? 'Activity Feed'
                                    : activeFilter === 'liked-properties'
                                        ? 'Liked Properties'
                                        : activeFilter === 'comments'
                                            ? 'Your Comments'
                                            : 'Liked Comments'
                                }
                            </h2>

                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="animate-pulse flex justify-center">
                                        <div className="h-6 w-6 bg-blue-200 rounded-full"></div>
                                    </div>
                                    <p className="mt-2 text-gray-500">Loading activity...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center py-8 bg-red-50 rounded-lg">
                                    <p className="text-red-500">
                                        Failed to load activity data. Please try again.
                                    </p>
                                    <button
                                        onClick={handleRetry}
                                        className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Comments Section */}
                                    {activeFilter === 'all' || activeFilter === 'comments' ? (
                                        comments.recent.length > 0 ? (
                                            <div>
                                                {activeFilter === 'all' && <h3 className="text-lg font-medium mb-2">Your Comments</h3>}
                                                {comments.recent.map(comment => (
                                                    <ActivityItem
                                                        key={comment.id}
                                                        icon={
                                                            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                            </svg>
                                                        }
                                                        title={comment.propertyTitle}
                                                        subtitle={comment.content}
                                                        date={comment.createdAt}
                                                        link={`/feed?property=${comment.propertyId}`}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            activeFilter === 'comments' && (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-500">You haven't made any comments yet.</p>
                                                    <Link to="/feed" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                                                        Discover Properties
                                                    </Link>
                                                </div>
                                            )
                                        )
                                    ) : null}

                                    {/* Liked Properties Section */}
                                    {activeFilter === 'all' || activeFilter === 'liked-properties' ? (
                                        likes.recent.length > 0 ? (
                                            <div className={activeFilter === 'all' ? "mt-6" : ""}>
                                                {activeFilter === 'all' && <h3 className="text-lg font-medium mb-2">Liked Properties</h3>}
                                                <div className={activeFilter === 'liked-properties' ? "grid grid-cols-1 md:grid-cols-2 gap-4" : ""}>
                                                    {likes.recent.map(like => (
                                                        <ActivityItem
                                                            key={like.id}
                                                            icon={
                                                                <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                </svg>
                                                            }
                                                            title={like.propertyTitle}
                                                            subtitle="Click to view property details"
                                                            date={like.createdAt}
                                                            link={`/feed?property=${like.propertyId}`}
                                                            image={like.propertyImage}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            activeFilter === 'liked-properties' && (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-500">You haven't liked any properties yet.</p>
                                                    <Link to="/feed" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                                                        Find Properties to Like
                                                    </Link>
                                                </div>
                                            )
                                        )
                                    ) : null}

                                    {/* Liked Comments Section */}
                                    {activeFilter === 'all' || activeFilter === 'liked-comments' ? (
                                        likedComments?.recent?.length > 0 ? (
                                            <div className={activeFilter === 'all' ? "mt-6" : ""}>
                                                {activeFilter === 'all' && <h3 className="text-lg font-medium mb-2">Liked Comments</h3>}
                                                {likedComments.recent.map(likedComment => (
                                                    <ActivityItem
                                                        key={likedComment.id}
                                                        icon={
                                                            <svg className="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                                            </svg>
                                                        }
                                                        title={`Comment on: ${likedComment.propertyTitle}`}
                                                        subtitle={`${likedComment.commentAuthor}: "${likedComment.commentContent.substring(0, 60)}${likedComment.commentContent.length > 60 ? '...' : ''}"`}
                                                        date={likedComment.createdAt}
                                                        link={`/feed?property=${likedComment.propertyId}`}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            activeFilter === 'liked-comments' && (
                                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-500">You haven't liked any comments yet.</p>
                                                    <Link to="/feed" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                                                        Explore Conversations
                                                    </Link>
                                                </div>
                                            )
                                        )
                                    ) : null}

                                    {/* Show message if no activity for all filter */}
                                    {activeFilter === 'all' &&
                                        comments.recent.length === 0 &&
                                        likes.recent.length === 0 &&
                                        likedComments?.recent?.length === 0 && (
                                            <div className="text-center py-10 bg-gray-50 rounded-lg">
                                                <p className="text-gray-500">No recent activity to display.</p>
                                                <p className="text-gray-500 mt-2">Start exploring properties to like or comment!</p>
                                                <Link to="/feed" className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                                                    Browse Properties
                                                </Link>
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;