import { useEffect, useRef, useState, useCallback } from "react";
import axios from 'axios';
import { API_URL } from "../../../shared";
import { useAuth } from "../../../Features/auth";
import { CommentPanel } from "../../../shared";
import { LikeService, PropertyList } from "..";
import { toVideoCardProperties } from "../../../shared/Utils/TypeTransformers";
import { getErrorMessage } from "../../../shared";
import { useParams, useSearchParams } from 'react-router-dom';

// Import types
import { Property, VideoCardProperty } from "../types/Property";
import { PropertyLikeState, PropertyLoadingState } from "../types/Property";

export default function UserVideoFeed() {
    // Get userId from URL parameters
    const { userId } = useParams<{ userId: string }>();
    const [searchParams] = useSearchParams();
    const propertyIdFromUrl = searchParams.get('property');

    const { authState } = useAuth();
    const { token, isAuthenticated } = authState;
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [properties, setProperties] = useState<VideoCardProperty[]>([]);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const [userName, setUserName] = useState("");

    // State for comment sidebar
    const [showComments, setShowComments] = useState(false);
    const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
    const [hasLargeLayout, setHasLargeLayout] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);

    // State for likes management
    const [propertyLikes, setPropertyLikes] = useState<PropertyLikeState>({});
    const [isLikeLoading, setIsLikeLoading] = useState<PropertyLoadingState>({});
    const [likeStatusChecked, setLikeStatusChecked] = useState(false);

    // Use refs to track component mount state and prevent race conditions
    const isMounted = useRef(true);
    const hasScrolledToProperty = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Comment panel width and animation offset
    const commentPanelWidth = windowWidth < 1400 ? 500 : 580;
    const slideOffset = 75;

    // Breakpoint for large layout
    const LARGE_LAYOUT_BREAKPOINT = 1280;

    // This ensures proper cleanup on unmount
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            // Force any playing videos to stop when unmounting
            document.querySelectorAll('video').forEach((video) => {
                video.pause();
                video.src = '';
                video.load();
            });
        };
    }, []);

    // Define checkAllLikeStatus with proper memoization and mount check
    const checkAllLikeStatus = useCallback(async (props: VideoCardProperty[]) => {
        if (!isAuthenticated || !token || props.length === 0 || likeStatusChecked || !isMounted.current) return;

        try {
            const newLikeStates = { ...propertyLikes };
            for (const property of props) {
                if (!isMounted.current) break; // Stop processing if component unmounted

                try {
                    const response = await LikeService.checkLikeStatus(property.id);
                    if (response.isSuccess) {
                        newLikeStates[property.id] = {
                            count: response.likesCount || 0,
                            isLiked: response.isLiked
                        };
                    }
                } catch (propertyError) {
                    console.error(`Error checking like status for property ${property.id}:`, propertyError);
                }
            }

            if (isMounted.current) {
                setPropertyLikes(newLikeStates);
                setLikeStatusChecked(true);
            }
        } catch (error) {
            console.error("Error checking like statuses:", error);
        }
    }, [isAuthenticated, token, propertyLikes, likeStatusChecked]);

    // Add global style to remove scrollbars and fix TikTok-style scrolling
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            * {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
            *::-webkit-scrollbar {
                display: none;
            }
            /* Ensure strict scroll containment */
            .snap-y.snap-mandatory {
                scroll-snap-type: y mandatory;
            }
            .snap-y.snap-mandatory > * {
                scroll-snap-align: start;
                scroll-snap-stop: always;
            }
            /* Hide any overflow beyond the current item */
            .property-container {
                height: calc(100vh - 110px); /* Adjusted for navbar + user header */
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }
            /* Smooth animation for comment panel */
            .comment-panel-slide {
                transition: transform 400ms cubic-bezier(0.33, 1, 0.68, 1);
            }
            /* Smooth animation for video shift */
            .video-shift {
                transition: transform 400ms cubic-bezier(0.33, 1, 0.68, 1), width 400ms cubic-bezier(0.33, 1, 0.68, 1);
            }
            /* Fix for aborted video playback */
            video {
                will-change: transform;
            }
        `;
        document.head.appendChild(style);

        return () => {
            if (style.parentNode) {
                document.head.removeChild(style);
            }
        };
    }, []);

    // Check window size for responsive layout
    useEffect(() => {
        const checkLayoutSize = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
            setHasLargeLayout(width >= LARGE_LAYOUT_BREAKPOINT);
        };

        checkLayoutSize();
        window.addEventListener('resize', checkLayoutSize);

        return () => window.removeEventListener('resize', checkLayoutSize);
    }, []);

    // Fetch properties from the API and filter for this user
    useEffect(() => {
        if (!userId) return;

        // Reset like status check when fetching new data
        setLikeStatusChecked(false);
        hasScrolledToProperty.current = false;

        const fetchProperties = async () => {
            try {
                setIsLoading(true);

                const headers: Record<string, string> = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const response = await axios.get<Property[]>(`${API_URL}/api/Property`, { headers });

                // Don't update state if component unmounted during request
                if (!isMounted.current) return;

                const mappedProperties = toVideoCardProperties(response.data, API_URL);

                // Filter for user properties
                const userProperties = mappedProperties.filter(prop => {
                    if (prop.userId === userId) return true;
                    if (prop.username && authState.user &&
                        (prop.username === authState.user.firstName ||
                            prop.username.includes(authState.user.firstName || ''))) {
                        return true;
                    }
                    return false;
                });

                if (userProperties.length === 0) {
                    // Fallback to all properties if no user properties found
                    setProperties(mappedProperties);
                    setError("No videos found specifically for this user. Showing all videos.");
                } else {
                    setProperties(userProperties);
                    if (userProperties[0].username) {
                        setUserName(userProperties[0].username);
                        document.title = `${userProperties[0].username}'s Videos`;
                    }
                }

                // Initialize like states
                const likesState: PropertyLikeState = {};
                (userProperties.length > 0 ? userProperties : mappedProperties).forEach(prop => {
                    likesState[prop.id] = {
                        count: prop.likes || 0,
                        isLiked: false
                    };
                });
                setPropertyLikes(likesState);

                // Handle specific property from URL after data is loaded
                if (propertyIdFromUrl) {
                    const properties = userProperties.length > 0 ? userProperties : mappedProperties;
                    const index = properties.findIndex(prop => prop.id === propertyIdFromUrl);
                    if (index !== -1) {
                        setActiveVideoIndex(index);
                        setActivePropertyId(propertyIdFromUrl);

                        // Use RAF to ensure DOM is ready
                        requestAnimationFrame(() => {
                            setTimeout(() => {
                                if (!isMounted.current) return;

                                const container = containerRef.current;
                                if (container) {
                                    const items = container.querySelectorAll('.snap-start');
                                    if (items && items[index]) {
                                        items[index].scrollIntoView({ behavior: 'auto' });
                                        hasScrolledToProperty.current = true;
                                    }
                                }
                            }, 300);
                        });
                    }
                }
            } catch (err) {
                if (isMounted.current) {
                    console.error('Error fetching properties:', err);
                    setError(getErrorMessage(err, 'Failed to load videos'));
                }
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        };

        fetchProperties();
    }, [token, userId, propertyIdFromUrl, authState.user]);

    // Check like status in a separate effect
    useEffect(() => {
        if (isAuthenticated && properties.length > 0 && !likeStatusChecked) {
            checkAllLikeStatus(properties);
        }
    }, [isAuthenticated, properties, likeStatusChecked, checkAllLikeStatus]);

    const handleToggleComments = useCallback((propertyId: string) => {
        setActivePropertyId(propertyId);
        setShowComments(true);
    }, []);

    // Debounced like toggle to prevent multiple rapid calls
    const handleLikeToggle = useCallback(async (propertyId: string) => {
        if (!authState.isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        // Don't proceed if already loading
        if (isLikeLoading[propertyId]) return;

        setIsLikeLoading(prev => ({ ...prev, [propertyId]: true }));

        try {
            const response = await LikeService.toggleLike(propertyId);
            if (isMounted.current && response.isSuccess) {
                setPropertyLikes(prev => ({
                    ...prev,
                    [propertyId]: {
                        count: response.likesCount,
                        isLiked: response.isLiked
                    }
                }));
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        } finally {
            if (isMounted.current) {
                setIsLikeLoading(prev => ({ ...prev, [propertyId]: false }));
            }
        }
    }, [authState.isAuthenticated, isLikeLoading]);

    const handleVideoCardLikeToggle = useCallback((propertyId: string, isLiked: boolean, count: number) => {
        setPropertyLikes(prev => ({
            ...prev,
            [propertyId]: { count, isLiked }
        }));
    }, []);

    const getVideoWidth = useCallback(() => {
        if (!hasLargeLayout) return '600px';
        return windowWidth >= 1600 ? '760px' : '680px';
    }, [hasLargeLayout, windowWidth]);

    const handleVideoInView = useCallback((index: number) => {
        // Only update if it actually changed to avoid race conditions
        if (index !== activeVideoIndex) {
            setActiveVideoIndex(index);
        }
    }, [activeVideoIndex]);

    // Update UI based on active video
    useEffect(() => {
        if (properties.length > 0 && activeVideoIndex >= 0 && activeVideoIndex < properties.length) {
            const activeProperty = properties[activeVideoIndex];
            document.title = `${userName || "User"}'s Video - ${activeProperty.caption?.substring(0, 30) || ""}`;

            // Only update URL if property ID changed (prevents unnecessary history updates)
            if (typeof window !== 'undefined' && window.history && window.history.replaceState &&
                activePropertyId !== activeProperty.id) {
                const newUrl = `/user-videos/${userId}?property=${activeProperty.id}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
                setActivePropertyId(activeProperty.id);
            }
        }
    }, [activeVideoIndex, properties, userId, userName, activePropertyId]);

    // Render code remains the same...
    if (isLoading) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading videos...</p>
                </div>
            </div>
        );
    }

    if (properties.length === 0 && !isLoading) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Videos Found</h2>
                    <p className="text-gray-600 mb-4">We couldn't find any videos for this user.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100">
            {/* User header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center">
                <div className="flex items-center">
                    <img
                        src={properties[0]?.avatarUrl || "/default-avatar.jpg"}
                        alt={`${userName}'s avatar`}
                        className="w-8 h-8 rounded-full mr-2"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDggNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";
                        }}
                    />
                    <span className="font-medium">{userName || "User"}'s Videos</span>
                </div>
                <span className="mx-2 text-gray-500">•</span>
                <span className="text-gray-500 text-sm">{properties.length} videos</span>

                {/* Add a back button */}
                <div className="ml-auto">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>
            </div>

            {/* Display error message as a banner if there is one but we still have properties */}
            {error && properties.length > 0 && (
                <div className="bg-yellow-50 border-yellow-400 border-l-4 p-2 text-sm text-yellow-700">
                    <p>{error}</p>
                </div>
            )}

            {/* Main container with fixed height and overflow control */}
            <div
                className="overflow-hidden"
                ref={containerRef}
                style={{ height: "calc(100vh - 142px)" }}
            >
                {/* Container with width adjustment for comment panel */}
                <div
                    className="h-full video-shift"
                    style={{
                        width: hasLargeLayout && showComments ? `calc(100% - ${commentPanelWidth}px)` : '100%',
                    }}
                >
                    <PropertyList
                        properties={properties}
                        propertyLikes={propertyLikes}
                        isLikeLoading={isLikeLoading}
                        showComments={showComments}
                        hasLargeLayout={hasLargeLayout}
                        slideOffset={slideOffset}
                        getVideoWidth={getVideoWidth}
                        onVideoInView={handleVideoInView}
                        onLikeToggle={handleVideoCardLikeToggle}
                        onToggleComments={handleToggleComments}
                        handleLikeToggle={handleLikeToggle}
                        activeVideoIndex={activeVideoIndex}
                    />
                </div>

                {/* Comments Panel with animation */}
                {activePropertyId && (
                    <>
                        {/* On large screens: Side panel */}
                        {hasLargeLayout && (
                            <div
                                className="fixed right-0 bottom-0 z-40 shadow-xl border-l border-gray-200 bg-white comment-panel-slide"
                                style={{
                                    width: `${commentPanelWidth}px`,
                                    transform: showComments ? 'translateX(0)' : 'translateX(100%)',
                                    top: "87px"
                                }}
                            >
                                <CommentPanel
                                    propertyId={activePropertyId}
                                    onClose={() => setShowComments(false)}
                                    displayMode="sidebar"
                                />
                            </div>
                        )}

                        {/* On smaller screens: Modal dialog */}
                        {!hasLargeLayout && showComments && (
                            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-fadeIn">
                                <div
                                    className="fixed bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
                                    style={{
                                        maxHeight: '90vh',
                                        width: '90%',
                                        maxWidth: '480px',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <CommentPanel
                                        propertyId={activePropertyId}
                                        onClose={() => setShowComments(false)}
                                        displayMode="modal"
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}