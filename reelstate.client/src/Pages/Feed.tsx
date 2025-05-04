import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { API_URL } from "../Services/config";
import { useAuth } from "../Hooks/useAuth";
import VideoCard from "../Components/VideoCard";
import CommentPanel from "../Components/Layout/CommentPanel";
import { Property } from "../Models/Property";
import LikeService from "../Services/LikeService";

// Interface for mapped property format needed by VideoCard
interface VideoCardProperty {
    id: string;
    username: string;
    caption: string;
    videoUrl: string;
    likes: number;
    comments: number;
    avatarUrl: string;
    rooms?: number;
    propertyType?: string;
    space?: number;
    photos?: string[];
    location?: {
        address: string;
        city: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
}

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
    const [propertyLikes, setPropertyLikes] = useState<{ [key: string]: { count: number, isLiked: boolean } }>({});
    const [isLikeLoading, setIsLikeLoading] = useState<{ [key: string]: boolean }>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    // Initialize videoRefs with the correct length
    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, properties.length);
    }, [properties]);

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

                // Map API response to the format VideoCard expects
                const mappedProperties: VideoCardProperty[] = response.data.map(property => ({
                    id: property.id,
                    username: property.user?.firstName || 'Unknown User',
                    caption: property.caption,
                    videoUrl: `${API_URL}${property.videoUrl}`,
                    likes: property.likesCount || 0,
                    comments: property.commentsCount || 0,
                    avatarUrl: property.user?.profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg',
                    rooms: property.rooms,
                    propertyType: property.propertyType,
                    space: property.space,
                    photos: property.photos?.map(p => `${API_URL}${p.photoUrl}`) || [],
                    location: {
                        address: property.address,
                        city: property.city,
                        coordinates: {
                            lat: property.latitude,
                            lng: property.longitude
                        }
                    }
                }));

                // Initialize like state for all properties
                const likesState: { [key: string]: { count: number, isLiked: boolean } } = {};
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
    }, [token]);

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

    // Set up intersection observer to detect which video is in view
    useEffect(() => {
        if (properties.length === 0) return;

        const options = {
            root: null,
            rootMargin: "0px",
            threshold: 0.6,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = videoRefs.current.findIndex((ref) => ref === entry.target);
                    if (index !== -1) {
                        setActiveVideoIndex(index);
                    }
                }
            });
        }, options);

        videoRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            videoRefs.current.forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, [properties]);

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

    // Action buttons for desktop layout
    const ActionButtons = ({ property }: { property: VideoCardProperty }) => {
        const isLiked = propertyLikes[property.id]?.isLiked || false;
        const likeCount = propertyLikes[property.id]?.count || property.likes;
        const isLoading = isLikeLoading[property.id] || false;

        return (
            <div className="flex flex-col items-center space-y-6 z-30">
                {/* User icon */}
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-gray-200 shadow-md">
                        <img
                            src={property.avatarUrl}
                            alt={property.username}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {property.username}
                    </span>
                </div>

                {/* Like button */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={() => handleLikeToggle(property.id)}
                        disabled={isLoading}
                        className={`w-11 h-11 ${isLiked ? 'bg-red-50' : 'bg-white'} rounded-full shadow-md flex items-center justify-center transition-all hover:shadow-lg ${isLoading ? 'opacity-70' : ''}`}
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg
                                className={`w-5 h-5 ${isLiked ? 'text-red-500' : 'text-gray-700'}`}
                                fill={isLiked ? "currentColor" : "none"}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        )}
                    </button>
                    <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {likeCount}
                    </span>
                </div>

                {/* Comment button */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={() => handleToggleComments(property.id)}
                        className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:bg-blue-50 hover:shadow-lg"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </button>
                    <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                        {property.comments}
                    </span>
                </div>

                {/* Share button - Using inline share functionality */}
                <div className="flex flex-col items-center">
                    <button
                        onClick={() => {
                            const url = window.location.href;
                            if (navigator.share) {
                                navigator.share({
                                    title: 'Check out this property!',
                                    text: `${property.caption.substring(0, 50)}${property.caption.length > 50 ? '...' : ''}`,
                                    url: `${url}?property=${property.id}`
                                }).catch(error => console.error('Error sharing:', error));
                            } else {
                                prompt('Copy this link to share:', `${url}?property=${property.id}`);
                            }
                        }}
                        className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center transition-all hover:bg-green-50 hover:shadow-lg"
                    >
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <span className="text-black text-xs mt-2 font-medium bg-white px-2 py-0.5 rounded-full shadow-sm">
                        Share
                    </span>
                </div>
            </div>
        );
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
            <div className="relative h-[calc(100vh-55px)]">
                {/* Feed content - No scrollbar */}
                <div
                    ref={containerRef}
                    className="snap-y snap-mandatory overflow-y-auto h-full bg-gray-100"
                >
                    {properties.map((property, index) => {
                        // Get like state for this property
                        const propertyLikeState = propertyLikes[property.id] || { count: property.likes, isLiked: false };

                        return (
                            <div
                                key={property.id}
                                ref={(el) => { videoRefs.current[index] = el }}
                                className="snap-start snap-always w-full py-1.5 flex justify-center"
                                style={{ height: 'calc(100vh - 105px)' }}
                            >
                                {/* Content wrapper with shared animation */}
                                <div
                                    className="relative flex justify-center transition-transform duration-500 ease-in-out"
                                    style={{
                                        transform: hasLargeLayout && showComments ? `translateX(-${slideOffset}px)` : 'translateX(0)'
                                    }}
                                >
                                    {/* Video Card Component */}
                                    <div
                                        className="h-full rounded-lg overflow-hidden"
                                        style={{ width: getVideoWidth() }}
                                    >
                                        <VideoCard
                                            {...property}
                                            likes={propertyLikeState.count}
                                            onCommentClick={() => handleToggleComments(property.id)}
                                            externalButtons={hasLargeLayout}
                                            onLikeToggle={(isLiked, count) => handleVideoCardLikeToggle(property.id, isLiked, count)}
                                        />
                                    </div>

                                    {/* External Action Buttons - Inside the shared container */}
                                    {hasLargeLayout && (
                                        <div className="absolute right-[-70px] top-1/2 transform -translate-y-1/2 z-30">
                                            <ActionButtons property={{
                                                ...property,
                                                likes: propertyLikeState.count
                                            }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

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