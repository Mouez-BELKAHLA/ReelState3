import { useState, useRef, useEffect, useContext } from 'react';
import AuthContext from '../Contexts/AuthContext';
import LikeService from '../Services/LikeService';
import ShareButton from '../Components/Common/ShareButton'; // Import the ShareButton component

type VideoCardProps = {
    id: string;
    username: string;
    caption: string;
    videoUrl: string;
    likes: number;
    comments: number;
    avatarUrl: string;
    // Adding real estate specific properties
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
    onCommentClick?: () => void;
    externalButtons?: boolean; // Whether buttons are rendered externally
    onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
};

export default function VideoCard({
    id,
    username,
    caption,
    videoUrl,
    likes,
    comments,
    avatarUrl,
    rooms = 2,
    propertyType = "appartement",
    space = 75,
    photos = [
        "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80"
    ],
    location = {
        address: "123 Avenue des Champs-Élysées",
        city: "Paris",
        coordinates: {
            lat: 48.8566,
            lng: 2.3522
        }
    },
    onCommentClick,
    externalButtons = false,
    onLikeToggle
}: VideoCardProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Comment count from props
    const [commentsCount, setCommentsCount] = useState(comments);

    // Like state
    const [likeCount, setLikeCount] = useState(likes);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    // Get auth context to check if user is logged in
    const auth = useContext(AuthContext);

    // Touch handling
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Mouse drag handling
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const dragThreshold = 100;

    const carouselRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const rightArrowRef = useRef<HTMLButtonElement>(null);
    const leftArrowRef = useRef<HTMLButtonElement>(null);

    const totalItems = 1 + photos.length + 1;
    const locationIndex = 1 + photos.length;

    // Check like status when component mounts
    useEffect(() => {
        const checkLikeStatus = async () => {
            if (auth?.authState.isAuthenticated) {
                try {
                    const response = await LikeService.checkLikeStatus(id);
                    if (response.isSuccess) {
                        setIsLiked(response.isLiked);
                        setLikeCount(response.likesCount);
                    }
                } catch (error) {
                    console.error("Error checking like status:", error);
                }
            }
        };

        checkLikeStatus();
    }, [id, auth?.authState.isAuthenticated]);

    // Handle like toggle
    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering other click events

        // Check if user is authenticated
        if (!auth?.authState.isAuthenticated) {
            // Redirect to login or show a modal
            alert("Please log in to like this property");
            return;
        }

        setIsLikeLoading(true);

        try {
            const response = await LikeService.toggleLike(id);

            if (response.isSuccess) {
                setIsLiked(response.isLiked);
                setLikeCount(response.likesCount);

                // Call the callback if provided
                if (onLikeToggle) {
                    onLikeToggle(response.isLiked, response.likesCount);
                }
            } else {
                console.error("Failed to toggle like:", response.message);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        } finally {
            setIsLikeLoading(false);
        }
    };

    // Function to determine the content type based on index
    const getContentType = (index: number): 'video' | 'photo' | 'location' => {
        if (index === 0) return 'video';
        if (index === locationIndex) return 'location';
        return 'photo';
    };

    // Handle video play/pause
    const togglePlay = () => {
        if (!videoRef.current) return;

        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    // Animation keyframes
    const pulseGradientKeyframes = `
    @keyframes pulseGradient {
      0% { opacity: 0.8; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

    // Handle navigation with content type checking and immediate scrolling
    const navigateTo = (newIndex: number) => {
        // First, update the actual index for immediate carousel scrolling
        setActiveIndex(newIndex);

        // Then check if we need to animate
        const currentType = getContentType(activeIndex);
        const newType = getContentType(newIndex);

        if (currentType !== newType) {
            setIsAnimating(true);
            // Reset animation after a short delay
            setTimeout(() => {
                setIsAnimating(false);
            }, 400);
        }

        // Pause video if navigating away from it
        if (newIndex !== 0 && videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    // Handle swipe on touch devices
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && activeIndex < totalItems - 1) {
            navigateTo(activeIndex + 1);
        }

        if (isRightSwipe && activeIndex > 0) {
            navigateTo(activeIndex - 1);
        }

        // Reset
        setTouchStart(0);
        setTouchEnd(0);
    };

    // Mouse drag handling
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStartX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        // We're just tracking movement, not doing anything with it yet
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const dragEndX = e.clientX;
        const dragDistance = dragStartX - dragEndX;

        // Determine if we should navigate
        if (Math.abs(dragDistance) > dragThreshold) {
            if (dragDistance > 0 && activeIndex < totalItems - 1) {
                // Dragged left - go to next
                navigateTo(activeIndex + 1);
            } else if (dragDistance < 0 && activeIndex > 0) {
                // Dragged right - go to previous
                navigateTo(activeIndex - 1);
            }
        }

        // Reset drag state
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Shorthand navigation functions using navigateTo
    const goToVideo = () => navigateTo(0);
    const goToPhotos = () => navigateTo(1);
    const goToLocation = () => navigateTo(locationIndex);
    const goToItem = (index: number) => navigateTo(index);

    // Update carousel position when activeIndex changes
    useEffect(() => {
        if (carouselRef.current) {
            const scrollAmount = activeIndex * carouselRef.current.offsetWidth;
            carouselRef.current.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    }, [activeIndex]);

    // Add keyframe animation to document head
    useEffect(() => {
        // Add the animation to the document head
        const styleElement = document.createElement('style');
        styleElement.textContent = pulseGradientKeyframes;
        document.head.appendChild(styleElement);

        // Clean up on unmount
        return () => {
            document.head.removeChild(styleElement);
        };
    }, []);

    // Prevent default behavior for mouse events to avoid text selection during drag
    useEffect(() => {
        const carousel = carouselRef.current;

        const preventDefaultDrag = (e: DragEvent) => {
            e.preventDefault();
        };

        if (carousel) {
            carousel.addEventListener('dragstart', preventDefaultDrag);
        }

        return () => {
            if (carousel) {
                carousel.removeEventListener('dragstart', preventDefaultDrag);
            }
        };
    }, []);

    // Determine current content mode
    const isVideoMode = activeIndex === 0;
    const isLocationMode = activeIndex === locationIndex;
    const isPhotoMode = activeIndex > 0 && activeIndex < locationIndex;

    // Get the appropriate color based on the active mode
    const getIndicatorColor = () => {
        if (isVideoMode) return 'from-purple-500 to-blue-500';
        if (isPhotoMode) return 'from-amber-500 to-rose-500';
        if (isLocationMode) return 'from-emerald-500 to-teal-500';
        return 'from-white to-white';
    };

    // Get the appropriate text for the indicator
    const getIndicatorText = () => {
        if (isVideoMode) return 'VIDEO';
        if (isLocationMode) return 'LOCALISATION';
        return `PHOTO ${activeIndex}/${photos.length}`;
    };

    return (
        <div className="relative h-full rounded-xl overflow-hidden bg-black shadow-lg">
            {/* Carousel container */}
            <div
                ref={carouselRef}
                className="w-full h-full flex overflow-hidden snap-x snap-mandatory"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={{
                    scrollSnapType: 'x mandatory',
                    cursor: isDragging ? 'grabbing' : 'grab'
                }}
            >
                {/* Video item */}
                <div className="min-w-full w-full h-full flex-shrink-0 snap-center relative">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        onClick={togglePlay}
                    />

                    {/* Play/Pause overlay button */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                        onClick={e => {
                            e.stopPropagation(); // Prevent triggering the drag
                            togglePlay();
                        }}
                    >
                        <div className="bg-black bg-opacity-40 rounded-full p-4">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Photo items */}
                {photos.map((photo, index) => (
                    <div
                        key={index}
                        className="min-w-full w-full h-full flex-shrink-0 snap-center relative"
                    >
                        <img
                            src={photo}
                            alt={`Property photo ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}

                {/* Location section */}
                <div className="min-w-full w-full h-full flex-shrink-0 snap-center relative bg-black">
                    {/* Map background image (in a real app you'd use a map component) */}
                    <div className="w-full h-full bg-gray-800">
                        <img
                            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/pin-l+fa0(${location.coordinates?.lng},${location.coordinates?.lat})/${location.coordinates?.lng},${location.coordinates?.lat},13,0/800x1000?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA`}
                            alt="Property location map"
                            className="w-full h-full object-cover opacity-80"
                        />

                        {/* Location info overlay */}
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
                            <div className="backdrop-blur-lg bg-black/30 rounded-xl p-6 w-full max-w-md text-center">
                                <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                </svg>
                                <h2 className="text-xl font-bold mb-2">Localisation</h2>
                                <p className="text-lg mb-1">{location.address}</p>
                                <p className="text-md text-gray-300">{location.city}</p>

                                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center mx-auto transition-colors">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Ouvrir dans Google Maps
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation indicators */}
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 z-20">
                {[...Array(totalItems)].map((_, index) => (
                    <button
                        key={index}
                        onClick={(e) => {
                            e.stopPropagation();
                            goToItem(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${activeIndex === index ? 'bg-white w-4' : 'bg-white/40'}`}
                        aria-label={index === 0 ? "View video" : index === locationIndex ? "View location" : `View photo ${index}`}
                    />
                ))}
            </div>

            {/* Mid-screen navigation arrows - ONLY for external button mode */}
            {externalButtons && (
                <>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="h-10 w-10 flex items-center justify-center">
                            {(isPhotoMode || isLocationMode) && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        isLocationMode ? goToPhotos() : goToVideo();
                                    }}
                                    className="backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center w-10 h-10"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                        <div className="h-10 w-10 flex items-center justify-center">
                            {(isVideoMode || isPhotoMode) && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        isVideoMode ? goToPhotos() : goToLocation();
                                    }}
                                    className="backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center w-10 h-10"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Left side action buttons with proper left arrow */}
            <div className="absolute left-4 bottom-24 flex flex-col items-center space-y-4 z-10">
                {/* Left arrow - properly positioned, not just a placeholder */}
                <div className="flex items-center justify-center pointer-events-auto" style={{ height: '34px' }}>
                    {(isPhotoMode || isLocationMode) && (
                        <button
                            ref={leftArrowRef}
                            onClick={(e) => {
                                e.stopPropagation();
                                isLocationMode ? goToPhotos() : goToVideo();
                            }}
                            className="backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center"
                            style={{ width: '34px', height: '34px' }}
                            aria-label={isLocationMode ? "View photos" : "View video"}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    {/* Invisible placeholder when left arrow isn't needed */}
                    {!(isPhotoMode || isLocationMode) && (
                        <div style={{ width: '34px', height: '34px' }} className="opacity-0"></div>
                    )}
                </div>

                {/* Four invisible placeholders that exactly match the right side elements - ALWAYS rendered */}
                <div className="opacity-0 pointer-events-none" style={{ width: '40px', height: '40px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
            </div>

            {/* Right side action buttons - only shown if not using external buttons */}
            {!externalButtons && (
                <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-4 z-10">
                    {/* Right navigation arrow with exact specified dimensions - BOTTOM positioning */}
                    <div className="flex items-center justify-center" style={{ height: '34px' }}>
                        {(isVideoMode || isPhotoMode) && (
                            <button
                                ref={rightArrowRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    isVideoMode ? goToPhotos() : goToLocation();
                                }}
                                className="backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center"
                                style={{ width: '34px', height: '34px' }}
                                aria-label={isVideoMode ? "View photos" : "View location"}
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                        {/* Invisible placeholder to maintain layout when right arrow isn't visible */}
                        {!(isVideoMode || isPhotoMode) && (
                            <div style={{ width: '34px', height: '34px' }} className="opacity-0"></div>
                        )}
                    </div>

                    {/* User icon */}
                    <div className="flex flex-col items-center justify-center" style={{ height: '40px', width: '40px' }}>
                        <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-gray-200">
                            <img
                                src={avatarUrl}
                                alt={username}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Like button */}
                    <div className="flex flex-col items-center" style={{ height: '48px', width: '34px' }}>
                        <button
                            onClick={handleLikeToggle}
                            disabled={isLikeLoading}
                            className={`backdrop-blur-lg rounded-full p-1.5 transition-all border flex items-center justify-center
                                ${isLiked
                                    ? 'bg-red-500/30 border-red-400 hover:bg-red-600/40'
                                    : 'bg-transparent border-white/20 hover:bg-red-500/30'}`}
                            style={{ width: '34px', height: '34px' }}
                        >
                            <svg
                                className={`w-5 h-5 ${isLiked ? 'text-red-400 fill-current' : 'text-white'}`}
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
                        </button>
                        <span className="text-white text-xs font-medium mt-2">
                            {isLikeLoading ? '...' : likeCount.toLocaleString()}
                        </span>
                    </div>

                    {/* Comment button */}
                    <div className="flex flex-col items-center" style={{ height: '48px', width: '34px' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onCommentClick) {
                                    // Pause video if opening comments
                                    if (videoRef.current && !videoRef.current.paused) {
                                        videoRef.current.pause();
                                        setIsPlaying(false);
                                    }
                                    onCommentClick();
                                }
                            }}
                            className="backdrop-blur-lg rounded-full p-1.5 transition-all border border-white/20 flex items-center justify-center bg-transparent hover:bg-blue-500/30"
                            style={{ width: '34px', height: '34px' }}
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </button>
                        <span className="text-white text-xs font-medium mt-2">{commentsCount.toLocaleString()}</span>
                    </div>

                    {/* Share button - Using the separate ShareButton component */}
                    <ShareButton
                        id={id}
                        title="Check out this property!"
                        text={`${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}`}
                        className="backdrop-blur-lg bg-transparent rounded-full p-1.5 hover:bg-green-500/30 transition-all border border-white/20 flex items-center justify-center"
                        iconClassName="w-5 h-5 text-white"
                        textClassName="text-white text-xs font-medium mt-2"
                    />
                </div>
            )}

            {/* Media type indicator with animation */}
            <div className="absolute top-6 left-4 z-20">
                <div
                    className={`
                        backdrop-blur-lg
                        bg-transparent
                        py-1 px-3
                        rounded-md
                        border border-white/30
                        transition-all duration-150
                        overflow-hidden
                        relative
                        ${isAnimating ? 'scale-105' : ''}
                    `}
                >
                    {/* Background animated gradient when changing */}
                    <div
                        className={`
                            absolute inset-0 
                            bg-gradient-to-r ${getIndicatorColor()}
                            ${isAnimating ? 'opacity-100' : 'opacity-0'}
                            transition-opacity duration-300
                        `}
                        style={{
                            animation: isAnimating ? 'pulseGradient 0.4s ease-out' : 'none'
                        }}
                    />

                    {/* Text content */}
                    <span className="text-white text-xs font-medium relative z-10">
                        {getIndicatorText()}
                    </span>
                </div>
            </div>

            {/* Gradient overlay at the bottom for better text visibility */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

            {/* Real estate tags at bottom with pure blur effect - no background color */}
            <div className="absolute bottom-6 left-4 flex flex-wrap gap-2 z-10">
                <span className="backdrop-blur-lg bg-transparent text-white text-sm font-medium py-1 px-3 rounded-full flex items-center border border-white/30">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M3 21V7L12 3L21 7V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M9 14V17" strokeWidth="2" strokeLinecap="round" />
                        <path d="M15 14V17" strokeWidth="2" strokeLinecap="round" />
                        <path d="M21 21H3" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {rooms} pièces
                </span>
                <span className="backdrop-blur-lg bg-transparent text-white text-sm font-medium py-1 px-3 rounded-full flex items-center border border-white/30">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M2 22H22" strokeWidth="2" strokeLinecap="round" />
                        <path d="M3 8V18C3 18.5523 3.44772 19 4 19H20C20.5523 19 21 18.5523 21 18V8" strokeWidth="2" strokeLinecap="round" />
                        <path d="M6 8V4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {propertyType}
                </span>
                <span className="backdrop-blur-lg bg-transparent text-white text-sm font-medium py-1 px-3 rounded-full flex items-center border border-white/30">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M4 4H20V20H4V4Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 9H20" strokeWidth="2" />
                    </svg>
                    {space} m²
                </span>
            </div>

            {/* Caption below tags */}
            <div className="absolute bottom-20 left-4 right-12 z-10">
                <p className="text-white text-sm line-clamp-1">{caption}</p>
            </div>

            {/* Property title at bottom */}
            <div className="absolute bottom-2 left-4 right-12 z-10">
                <p className="text-white text-sm font-medium">Magnifique appartement lumineux au cœur de Lyon</p>
            </div>
        </div>
    );
}