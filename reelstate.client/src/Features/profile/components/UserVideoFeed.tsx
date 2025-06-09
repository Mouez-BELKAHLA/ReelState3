import { useEffect, useRef, useState, useCallback } from "react";
import axios from 'axios';
import { API_URL } from "../../../shared";
import { CommentPanel } from "../../../shared";
import { PropertyList } from "../../property";
import { toVideoCardProperties } from "../../../shared/Utils/TypeTransformers";
import { getErrorMessage } from "../../../shared";
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import {
    checkLikeStatus,
    toggleLike,
    setActiveVideoIndex as setReduxActiveVideoIndex,
    toggleComments,
    setActiveProperty,
    updatePropertyLike
} from "../../../store/slices/propertySlice";
import { setShowNavbar } from "../../../store/slices/uiSlice";

// Import types
import { Property, VideoCardProperty } from "../../property/types/Property";

export default function UserVideoFeed() {
    // Get userId from URL parameters
    const { userId } = useParams<{ userId: string }>();
    const [searchParams] = useSearchParams();
    const propertyIdFromUrl = searchParams.get('property');
    const navigate = useNavigate();

    // Redux
    const dispatch = useAppDispatch();
    const { isAuthenticated, token, user: authUser } = useAppSelector(state => state.auth);
    const { propertyLikes, likeLoading } = useAppSelector(state => state.property);
    const { showNavbar } = useAppSelector(state => state.ui);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [properties, setProperties] = useState<VideoCardProperty[]>([]);
    const [localActiveVideoIndex, setLocalActiveVideoIndex] = useState(0);
    const [userName, setUserName] = useState("");

    // State for comment sidebar
    const [showComments, setShowComments] = useState(false);
    const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
    const [hasLargeLayout, setHasLargeLayout] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(-1);
    const [isMobile, setIsMobile] = useState(false);

    // Track if like statuses have been checked
    const [likeStatusChecked, setLikeStatusChecked] = useState(false);

    // Session-based view tracking - only track when videos actually play
    const [sessionViewedVideos, setSessionViewedVideos] = useState<Set<string>>(new Set());
    const [viewLoading, setViewLoading] = useState<{ [key: string]: boolean }>({});

    // Use refs to track component mount state and prevent race conditions
    const isMounted = useRef(true);
    const hasScrolledToProperty = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Comment panel width and animation offset
    const commentPanelWidth = windowWidth < 1400 ? 500 : 580;
    const slideOffset = 75;

    // Breakpoints for responsive layout
    const LARGE_LAYOUT_BREAKPOINT = 1280;
    const MEDIUM_LAYOUT_BREAKPOINT = 768;
    const SMALL_LAYOUT_BREAKPOINT = 480;
    const MOBILE_BREAKPOINT = 768;

    // Function to increment view count - only called when video actually starts playing
    const incrementViewCount = useCallback(async (propertyId: string) => {
        // Check if already viewed in this session or currently loading
        if (sessionViewedVideos.has(propertyId) || viewLoading[propertyId]) {
            console.log(`View already counted for property ${propertyId} in this session`);
            return;
        }

        try {
            setViewLoading(prev => ({ ...prev, [propertyId]: true }));
            console.log(`Incrementing view for property: ${propertyId} (first play)`);

            const response = await axios.post(`${API_URL}/api/Property/${propertyId}/view`);

            if (response.data.success) {
                // Mark as viewed in this session
                setSessionViewedVideos(prev => new Set([...prev, propertyId]));

                // Update local state to reflect the view increment
                setProperties(prev => prev.map(prop =>
                    prop.id === propertyId
                        ? { ...prop, views: response.data.views }
                        : prop
                ));

                console.log(`View count updated for property ${propertyId}: ${response.data.views}`);
            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
        } finally {
            setViewLoading(prev => ({ ...prev, [propertyId]: false }));
        }
    }, [sessionViewedVideos, viewLoading]);

    // Show navbar by default when entering this component
    useEffect(() => {
        // Make sure navbar is visible when component mounts
        dispatch(setShowNavbar(true));

        // Cleanup - ensure navbar is visible when leaving this component
        return () => {
            dispatch(setShowNavbar(true));
        };
    }, [dispatch]);

    // Add scroll event listener to detect when user scrolls to a new property
    useEffect(() => {
        const container = containerRef.current;
        if (!container || !isMobile) return; // Only apply on mobile

        const handleScroll = () => {
            const scrollPosition = container.scrollTop;
            const itemHeight = container.clientHeight;
            const currentIndex = Math.round(scrollPosition / itemHeight);

            // If scrolled to a new item, hide the navbar (only on mobile)
            if (currentIndex !== previousIndex && currentIndex >= 0 && isMobile) {
                dispatch(setShowNavbar(false));
                setPreviousIndex(currentIndex);
            }
        };

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [dispatch, previousIndex, isMobile]);

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
        if (!isAuthenticated || props.length === 0 || likeStatusChecked || !isMounted.current) return;

        try {
            for (const property of props) {
                if (!isMounted.current) break; // Stop processing if component unmounted
                dispatch(checkLikeStatus(property.id));
            }

            if (isMounted.current) {
                setLikeStatusChecked(true);
            }
        } catch (error) {
            console.error("Error checking like statuses:", error);
        }
    }, [isAuthenticated, likeStatusChecked, dispatch]);

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
                height: calc(100vh - 55px);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
            }
            /* Responsive video container for all screens */
            .video-container {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            /* Ensure videos fill their container - cover instead of contain */
            video {
                width: 100%;
                height: 100%;
                object-fit: cover; /* Fill container and crop if necessary */
                background-color: black;
            }
            /* Smooth animation for comment panel */
            .comment-panel-slide {
                transition: transform 400ms cubic-bezier(0.33, 1, 0.68, 1);
            }
            /* Smooth animation for video shift */
            .video-shift {
                transition: transform 400ms cubic-bezier(0.33, 1, 0.68, 1), width 400ms cubic-bezier(0.33, 1, 0.68, 1);
            }
            
            /* TikTok-style slim video card */
            .tiktok-slim-card {
                aspect-ratio: 9/16 !important;
                max-width: 360px !important;
                width: 360px !important;
                margin: 0 auto;
                border-radius: 0 !important;
            }
            
            /* Responsive adjustments for different screens */
            @media (max-width: 480px) {
                .property-container {
                    padding: 0;
                }
                .tiktok-slim-card {
                    max-width: 100% !important;
                    width: 100% !important;
                }
            }
            
            @media (min-width: 481px) and (max-width: 768px) {
                .tiktok-slim-card {
                    max-width: 340px !important;
                    width: 340px !important;
                }
            }
            
            /* Property list item styles for TikTok-like appearance */
            .property-list-item {
                padding: 0 !important;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #000;
            }
            
            /* Navbar toggle button styles */
            .navbar-toggle {
                position: fixed;
                top: 16px;
                right: 16px;
                z-index: 1000;
                background-color: rgba(0, 0, 0, 0.5);
                color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                opacity: 0;
                visibility: hidden;
            }
            
            .navbar-toggle.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .navbar-toggle:hover {
                background-color: rgba(0, 0, 0, 0.7);
            }
            
            /* Only hide navbar on mobile */
            @media (min-width: 769px) {
                .navbar-toggle {
                    display: none !important;
                }
            }

            /* Back button styles */
            .back-button {
                position: fixed;
                top: 16px;
                left: 16px;
                z-index: 1001;
                background-color: rgba(0, 0, 0, 0.5);
                color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(10px);
            }
            
            .back-button:hover {
                background-color: rgba(0, 0, 0, 0.7);
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
            setIsMobile(width < MOBILE_BREAKPOINT);

            // On desktop, always show navbar
            if (width >= MOBILE_BREAKPOINT) {
                dispatch(setShowNavbar(true));
            }
        };

        checkLayoutSize();
        window.addEventListener('resize', checkLayoutSize);

        return () => window.removeEventListener('resize', checkLayoutSize);
    }, [dispatch]);

    // Handle back navigation
    const handleBackToProfile = useCallback(() => {
        navigate(`/profile/${userId}`);
    }, [navigate, userId]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleBackToProfile();
            } else if (e.key === 'ArrowUp' && localActiveVideoIndex > 0) {
                const newIndex = localActiveVideoIndex - 1;
                setLocalActiveVideoIndex(newIndex);
                dispatch(setReduxActiveVideoIndex(newIndex));
            } else if (e.key === 'ArrowDown' && localActiveVideoIndex < properties.length - 1) {
                const newIndex = localActiveVideoIndex + 1;
                setLocalActiveVideoIndex(newIndex);
                dispatch(setReduxActiveVideoIndex(newIndex));
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [localActiveVideoIndex, properties.length, handleBackToProfile, dispatch]);

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
                const userProperties = mappedProperties.filter(prop => prop.userId === userId);

                if (userProperties.length === 0) {
                    setError("No videos found for this user.");
                    setIsLoading(false);
                    return;
                }

                setProperties(userProperties);
                if (userProperties[0].username) {
                    setUserName(userProperties[0].username);
                    document.title = `${userProperties[0].username}'s Videos`;
                }

                // Handle specific property from URL after data is loaded
                if (propertyIdFromUrl) {
                    const index = userProperties.findIndex(prop => prop.id === propertyIdFromUrl);
                    if (index !== -1) {
                        setLocalActiveVideoIndex(index);
                        setActivePropertyId(propertyIdFromUrl);
                        // Update Redux state too
                        dispatch(setReduxActiveVideoIndex(index));
                        dispatch(setActiveProperty(propertyIdFromUrl));

                        // Increment view count for the specific property
                        incrementViewCount(propertyIdFromUrl);

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
                } else if (userProperties.length > 0) {
                    // If no specific property, set the first one as active and increment its view
                    setActivePropertyId(userProperties[0].id);
                    dispatch(setActiveProperty(userProperties[0].id));
                    incrementViewCount(userProperties[0].id);
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
    }, [token, userId, propertyIdFromUrl, dispatch, incrementViewCount]);

    // Check like status in a separate effect
    useEffect(() => {
        if (isAuthenticated && properties.length > 0 && !likeStatusChecked) {
            checkAllLikeStatus(properties);
        }
    }, [isAuthenticated, properties, likeStatusChecked, checkAllLikeStatus]);

    const handleToggleComments = useCallback((propertyId: string) => {
        setActivePropertyId(propertyId);
        setShowComments(true);
        // Also update Redux state
        dispatch(setActiveProperty(propertyId));
        dispatch(toggleComments(true));
    }, [dispatch]);

    // Handle like toggle using Redux
    const handleLikeToggle = useCallback(async (propertyId: string) => {
        if (!isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        // Don't proceed if already loading
        if (likeLoading[propertyId]) return;

        try {
            await dispatch(toggleLike(propertyId)).unwrap();
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    }, [isAuthenticated, likeLoading, dispatch]);

    const handleVideoCardLikeToggle = useCallback((propertyId: string, isLiked: boolean, count: number) => {
        // Update Redux state
        dispatch(updatePropertyLike({ propertyId, isLiked, count }));
    }, [dispatch]);

    // Calculate video width based on screen size - TikTok style slim videos
    const getVideoWidth = useCallback(() => {
        // For TikTok-like videos, we want a narrow width with 9:16 aspect ratio
        if (windowWidth < SMALL_LAYOUT_BREAKPOINT) {
            return '100%';  // Full width on small screens but with enforced aspect ratio
        } else if (windowWidth < MEDIUM_LAYOUT_BREAKPOINT) {
            return '340px'; // Slim width on medium screens
        } else {
            // Even on large screens, we keep it slim
            return '360px';
        }
    }, [windowWidth, SMALL_LAYOUT_BREAKPOINT, MEDIUM_LAYOUT_BREAKPOINT]);

    // Set active video index when video is in view - NO VIEW INCREMENT HERE
    const handleVideoInView = useCallback((index: number) => {
        // If we're moving to a new video
        if (index !== previousIndex) {
            // Hide navbar when switching to a new property (only on mobile)
            if (isMobile) {
                dispatch(setShowNavbar(false));
            }
            setPreviousIndex(index);

            // NO VIEW INCREMENT HERE - only happens when video actually plays
        }

        // Only update if it actually changed to avoid race conditions
        if (index !== localActiveVideoIndex && index >= 0 && index < properties.length) {
            setLocalActiveVideoIndex(index);
            // Update Redux state too
            dispatch(setReduxActiveVideoIndex(index));

            // Update active property
            const activeProperty = properties[index];
            if (activeProperty) {
                setActivePropertyId(activeProperty.id);
                dispatch(setActiveProperty(activeProperty.id));

                // Increment view count for the new video
                incrementViewCount(activeProperty.id);
            }
        }
    }, [localActiveVideoIndex, properties, dispatch, incrementViewCount, previousIndex, isMobile]);

    // Update UI based on active video
    useEffect(() => {
        if (properties.length > 0 && localActiveVideoIndex >= 0 && localActiveVideoIndex < properties.length) {
            const activeProperty = properties[localActiveVideoIndex];
            document.title = `${userName || "User"}'s Video - ${activeProperty.caption?.substring(0, 30) || ""}`;

            // Update URL without full navigation (just update browser history)
            if (typeof window !== 'undefined' && window.history && window.history.replaceState &&
                activePropertyId !== activeProperty.id) {
                const newUrl = `/user-videos/${userId}?property=${activeProperty.id}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
                setActivePropertyId(activeProperty.id);
                // Also update Redux state
                dispatch(setActiveProperty(activeProperty.id));
            }
        }
    }, [localActiveVideoIndex, properties, userId, userName, activePropertyId, dispatch]);

    // Handle navbar toggle
    const handleShowNavbar = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to container
        dispatch(setShowNavbar(true));
    };

    // Calculate container height based on navbar visibility - but always subtract navbar height on desktop
    const getContainerHeight = () => {
        if (!isMobile) {
            return 'calc(100vh - 55px)'; // Always leave space for navbar on desktop
        }
        return showNavbar ? 'calc(100vh - 55px)' : '100vh'; // Dynamic on mobile
    };

    if (isLoading) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-white">Loading videos...</p>
                </div>
            </div>
        );
    }

    if (error || properties.length === 0) {
        return (
            <div className="bg-black min-h-screen flex items-center justify-center">
                <div className="text-center text-white p-8 max-w-md mx-auto">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-semibold mb-2">No Videos Found</h2>
                    <p className="text-gray-400 mb-6">{error || "This user hasn't posted any videos yet."}</p>
                    <button
                        onClick={handleBackToProfile}
                        className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black h-screen overflow-hidden">
            {/* Back button - floating overlay style */}
            <div
                className="back-button"
                onClick={handleBackToProfile}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </div>

            {/* Navbar toggle button - only visible when navbar is hidden on mobile */}
            <div
                className={`navbar-toggle ${!showNavbar && isMobile ? 'visible' : ''}`}
                onClick={handleShowNavbar}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </div>

            <div
                className="overflow-hidden snap-y snap-mandatory"
                style={{ height: getContainerHeight(), transition: 'height 0.3s ease' }}
                ref={containerRef}
            >
                <div
                    className="h-full video-shift"
                    style={{
                        width: hasLargeLayout && showComments ? `calc(100% - ${commentPanelWidth}px)` : '100%',
                    }}
                >
                    <PropertyList
                        properties={properties}
                        propertyLikes={propertyLikes}
                        isLikeLoading={likeLoading}
                        showComments={showComments}
                        hasLargeLayout={hasLargeLayout}
                        slideOffset={slideOffset}
                        getVideoWidth={getVideoWidth}
                        onVideoInView={handleVideoInView}
                        onLikeToggle={handleVideoCardLikeToggle}
                        onToggleComments={handleToggleComments}
                        handleLikeToggle={handleLikeToggle}
                        activeVideoIndex={localActiveVideoIndex}
                        onVideoPlay={incrementViewCount}
                    />
                </div>

                {/* Comments Panel with animation */}
                {activePropertyId && (
                    <>
                        {/* On large screens: Side panel */}
                        {hasLargeLayout && (
                            <div
                                className="fixed right-0 bottom-0 z-40 shadow-xl border-l border-gray-600 bg-white comment-panel-slide"
                                style={{
                                    width: `${commentPanelWidth}px`,
                                    top: '55px', // Always account for navbar on desktop
                                    transform: showComments ? 'translateX(0)' : 'translateX(100%)',
                                    transition: 'transform 400ms cubic-bezier(0.33, 1, 0.68, 1)'
                                }}
                            >
                                <CommentPanel
                                    propertyId={activePropertyId}
                                    onClose={() => {
                                        setShowComments(false);
                                        dispatch(toggleComments(false));
                                    }}
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
                                        maxHeight: windowWidth < MEDIUM_LAYOUT_BREAKPOINT ? '85vh' : '90vh',
                                        width: windowWidth < MEDIUM_LAYOUT_BREAKPOINT ? '95%' : '90%',
                                        maxWidth: '480px',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <CommentPanel
                                        propertyId={activePropertyId}
                                        onClose={() => {
                                            setShowComments(false);
                                            dispatch(toggleComments(false));
                                        }}
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