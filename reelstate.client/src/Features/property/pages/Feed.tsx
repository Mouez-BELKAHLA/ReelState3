import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { API_URL } from "../../../shared";
import { useAuth } from "../../../Features/auth";
import { CommentPanel } from "../../../shared";
import { LikeService, PropertyList } from "..";
import { toVideoCardProperties } from "../../../shared/Utils/TypeTransformers";
import { getErrorMessage } from "../../../shared";

// Import the VideoCardProperty type
import { Property, VideoCardProperty } from "../types/Property";
import { PropertyLikeState, PropertyLoadingState } from "../types/Property";

export default function Feed() {
    const { authState } = useAuth();
    const { token, isAuthenticated } = authState;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [properties, setProperties] = useState<VideoCardProperty[]>([]);
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);

    // State for comment sidebar
    const [showComments, setShowComments] = useState(false);
    const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
    const [hasLargeLayout, setHasLargeLayout] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);

    // State for likes to manage from parent
    const [propertyLikes, setPropertyLikes] = useState<PropertyLikeState>({});
    const [isLikeLoading, setIsLikeLoading] = useState<PropertyLoadingState>({});

    const containerRef = useRef<HTMLDivElement>(null);

    // Comment panel width and animation offset
    const commentPanelWidth = windowWidth < 1400 ? 500 : 580; // Moderately wider comment panel
    const slideOffset = 75;

    // Breakpoint for large layout
    const LARGE_LAYOUT_BREAKPOINT = 1280;

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
            /* Smooth animation for comment panel */
            .comment-panel-slide {
                transition: transform 400ms cubic-bezier(0.33, 1, 0.68, 1);
            }
            /* Smooth animation for video shift */
            .video-shift {
                transition: transform 400ms cubic-bezier(0.33, 1, 0.68, 1), width 400ms cubic-bezier(0.33, 1, 0.68, 1);
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
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

    // Fetch properties from the API
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                setIsLoading(true);

                // Configure headers based on authentication
                const headers: Record<string, string> = {};
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const response = await axios.get<Property[]>(`${API_URL}/api/Property`, {
                    headers: headers
                });

                // Use our new transformer to convert API data to UI components
                const mappedProperties = toVideoCardProperties(response.data, API_URL);

                // Initialize like state for all properties
                const likesState: PropertyLikeState = {};
                mappedProperties.forEach(prop => {
                    likesState[prop.id] = {
                        count: prop.likes,
                        isLiked: false
                    };
                });
                setPropertyLikes(likesState);

                setProperties(mappedProperties);

                // Check like statuses after loading properties
                if (isAuthenticated) {
                    checkAllLikeStatus(mappedProperties);
                }
            } catch (err: unknown) { // Changed from any to unknown
                console.error('Error fetching properties:', err);
                setError(getErrorMessage(err, 'Failed to load properties'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, [token, isAuthenticated]);

    // Function to check like status for all properties
    const checkAllLikeStatus = async (props: VideoCardProperty[]) => {
        if (!isAuthenticated || !token || props.length === 0) return;

        try {
            const newLikeStates = { ...propertyLikes };

            for (const property of props) {
                try {
                    const response = await LikeService.checkLikeStatus(property.id);

                    if (response.isSuccess) {
                        newLikeStates[property.id] = {
                            count: response.likesCount,
                            isLiked: response.isLiked
                        };
                    }
                } catch (propertyError) {
                    console.error(`Error checking like status for property ${property.id}:`, propertyError);
                }
            }

            setPropertyLikes(newLikeStates);

        } catch (error) {
            console.error("Error checking like statuses:", error);
        }
    };

    // Handle comment toggle
    const handleToggleComments = (propertyId: string) => {
        setActivePropertyId(propertyId);
        setShowComments(true);
    };

    // Handle like toggle with proper state management
    const handleLikeToggle = async (propertyId: string) => {
        // Check if user is authenticated
        if (!authState.isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        // Set loading for this specific property
        setIsLikeLoading(prev => ({
            ...prev,
            [propertyId]: true
        }));

        try {
            // Use LikeService
            const response = await LikeService.toggleLike(propertyId);

            if (response.isSuccess) {
                // Update both states to keep them in sync
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
            // Clear loading state
            setIsLikeLoading(prev => ({
                ...prev,
                [propertyId]: false
            }));
        }
    };

    // Handle external like toggle - this is called from VideoCard
    const handleVideoCardLikeToggle = (propertyId: string, isLiked: boolean, count: number) => {
        setPropertyLikes(prev => ({
            ...prev,
            [propertyId]: { count, isLiked }
        }));
    };

    // Calculate video width based on screen size
    const getVideoWidth = () => {
        // Always return the same width for the same screen size
        // regardless of comment panel state
        if (!hasLargeLayout) return '600px';
        return windowWidth >= 1600 ? '760px' : '680px';
    };

    // Set active video index when video is in view
    const handleVideoInView = (index: number) => {
        setActiveVideoIndex(index);
    };

    // *** NEW EFFECT: Update UI based on active video ***
    useEffect(() => {
        if (properties.length > 0 && activeVideoIndex >= 0 && activeVideoIndex < properties.length) {
            const activeProperty = properties[activeVideoIndex];

            // 1. Update document title with current property
            document.title = `Reelstate - ${activeProperty.caption.substring(0, 30)}${activeProperty.caption.length > 30 ? '...' : ''}`;

            // 2. Update URL without page reload (for sharing)
            // Update URL without page reload (for sharing)
            if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
                const newUrl = `/feed?property=${activeProperty.id}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            }

            // 3. Update active property ID for potential comment display
            setActivePropertyId(activeProperty.id);

            // 4. Could add analytics tracking here
            console.log(`Viewing property: ${activeProperty.id}`);
        }
    }, [activeVideoIndex, properties]);

    if (isLoading) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error Loading Properties</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (properties.length === 0) {
        return (
            <div className="bg-gray-100 min-h-screen">
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Properties Found</h2>
                        <p className="text-gray-600 mb-4">Be the first to create a property listing!</p>
                        <a
                            href="/create"
                            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Create Listing
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 h-screen overflow-hidden">
            {/* Main container with fixed height and overflow control */}
            <div className="h-[calc(100vh-55px)] overflow-hidden" ref={containerRef}>
                {/* Container with width adjustment for comment panel - now with video-shift class */}
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
                        activeVideoIndex={activeVideoIndex} /* Pass active index to PropertyList */
                    />
                </div>

                {/* Comments Panel with improved animation */}
                {activePropertyId && (
                    <>
                        {/* On large screens: Side panel WITH animation - now with comment-panel-slide class */}
                        {hasLargeLayout && (
                            <div
                                className="fixed top-[55px] right-0 bottom-0 z-40 shadow-xl border-l border-gray-200 bg-white comment-panel-slide"
                                style={{
                                    width: `${commentPanelWidth}px`,
                                    transform: showComments ? 'translateX(0)' : 'translateX(100%)'
                                }}
                            >
                                <CommentPanel
                                    propertyId={activePropertyId}
                                    onClose={() => setShowComments(false)}
                                    displayMode="sidebar"
                                />
                            </div>
                        )}

                        {/* On smaller screens: Modal dialog with full overlay */}
                        {!hasLargeLayout && showComments && (
                            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-fadeIn">
                                <div
                                    className="fixed bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
                                    style={{
                                        maxHeight: '90vh',
                                        width: '90%',
                                        maxWidth: '480px',
                                        // Ensure the modal doesn't introduce unexpected scrolling
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