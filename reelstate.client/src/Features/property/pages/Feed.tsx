import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { API_URL } from "../../../shared"; // Use shared barrel
import { useAuth } from "../../../Features/auth"; // Already using feature barrel
import { CommentPanel } from "../../../shared"; // Use shared barrel
import { LikeService, PropertyList } from ".."; // Import from property feature barrel
import { toVideoCardProperties } from "../../../shared/Utils/TypeTransformers";

// Import the new type definitions
// Import types from property feature instead of unused folder
import { Property } from "../types/Property";
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

    // State for likes to manage from parent - using our new type
    const [propertyLikes, setPropertyLikes] = useState<PropertyLikeState>({});
    const [isLikeLoading, setIsLikeLoading] = useState<PropertyLoadingState>({});

    const containerRef = useRef<HTMLDivElement>(null);

    // Comment panel width and animation offset
    const commentPanelWidth = 400;
    const slideOffset = 75; // Consistent sliding distance

    // Breakpoint for large layout
    const LARGE_LAYOUT_BREAKPOINT = 1280;

    // Add global style to remove scrollbars
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
            } catch (err: any) {
                console.error('Error fetching properties:', err);
                setError(err.message || 'Failed to load properties');
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
        if (!hasLargeLayout) return 'min(100%, 600px)';
        return windowWidth >= 1600 ? '760px' : '680px';
    };

    // Set active video index when video is in view
    const handleVideoInView = (index: number) => {
        setActiveVideoIndex(index);
    };

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
        <div className="bg-gray-100 min-h-screen overflow-hidden">
            {/* Main container */}
            <div className="relative h-[calc(100vh-55px)]" ref={containerRef}>
                {/* Use the PropertyList component */}
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
                    handleLikeToggle={handleLikeToggle} // Pass the function to PropertyList
                />

                {/* Comments Panel */}
                {activePropertyId && (
                    <>
                        {/* On large screens: Side panel WITH animation */}
                        {hasLargeLayout && (
                            <div
                                className="fixed top-[55px] right-0 bottom-0 z-40 shadow-xl border-l border-gray-200 transition-all duration-500 ease-in-out"
                                style={{
                                    width: `${commentPanelWidth}px`,
                                    transform: showComments ? 'translateX(0)' : 'translateX(100%)'
                                }}
                            >
                                <CommentPanel
                                    propertyId={activePropertyId}
                                    onClose={() => setShowComments(false)}
                                    isMobile={false}
                                    displayMode="sidebar"
                                />
                            </div>
                        )}

                        {/* On smaller screens: Modal dialog in center */}
                        {!hasLargeLayout && showComments && (
                            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
                                <div className="max-h-[90%] w-[90%] max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col">
                                    <CommentPanel
                                        propertyId={activePropertyId}
                                        onClose={() => setShowComments(false)}
                                        isMobile={false}
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