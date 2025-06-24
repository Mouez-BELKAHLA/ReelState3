import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../../store/hooks';
import { checkLikeStatus, toggleLike } from '../../../../store/slices/propertySlice';
import axios from 'axios'; // Make sure axios is imported

// Import components but NOT ArrowButton (keeping your existing imports)
import {
    CarouselIndicators,
    CommentButton,
    ContentTypeIndicator,
    LikeButton,
    PropertyInfoTags,
    UserProfile,
} from '../..';

// Import from shared
import { ShareButton } from "../../../../shared";

// Import the dynamic tags component
import DynamicPropertyTags from './DynamicPropertyTags';

// Import types
import { VideoCardProperty } from '../../types/Property';

// Additional props specific to the VideoCard component
type VideoCardProps = VideoCardProperty & {
    onCommentClick?: () => void;
    externalButtons?: boolean;
    onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
    videoRef?: React.Ref<HTMLVideoElement>; // Accept video ref from parent
    isActive?: boolean; // Mark if this card is active
};

// Helper to capitalize first letter
const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function VideoCard({
    id,
    userId,
    username,
    caption,
    videoUrl,
    likes = 0,
    comments = 0,
    views = 0,
    avatarUrl = '',
    rooms = 2,
    propertyType = "apartment",
    space = 75,
    photos = [],
    location = {
        address: "123 Avenue des Champs-Élysées",
        city: "Paris",
        coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    onCommentClick,
    externalButtons = false,
    onLikeToggle,
    title = "Magnifique appartement lumineux au cœur de Lyon",
    videoRef,
    isActive = false,
    propertyPreferences = [],
    propertyFeatures = [],
    status = 'approved',
}: VideoCardProps) {
    // Redux hooks
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector(state => state.auth);
    const { propertyLikes, likeLoading } = useAppSelector(state => state.property);

    // Component state
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [userPaused, setUserPaused] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [commentsCount] = useState(comments);
    const [localViews, setLocalViews] = useState(views); // Add local state for views
    const [viewIncremented, setViewIncremented] = useState(false); // Track if view has been incremented

    // Touch handling state
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const dragThreshold = 100;

    const carouselRef = useRef<HTMLDivElement>(null);
    const internalVideoRef = useRef<HTMLVideoElement>(null);

    const totalItems = 1 + photos.length + 1;
    const locationIndex = 1 + photos.length;

    // Get like state from Redux
    const likeState = propertyLikes[id] || { isLiked: false, count: likes };
    const isLikeLoading = likeLoading[id] || false;

    // Animation keyframes
    const pulseGradientKeyframes = `
    @keyframes pulseGradient {
      0% { opacity: 0.8; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;

    // Check like status when component mounts
    useEffect(() => {
        if (isAuthenticated) {
            dispatch(checkLikeStatus(id));
        }
    }, [id, isAuthenticated, dispatch]);

    // New function to increment view count
    const incrementViewCount = async () => {
        if (viewIncremented) return; // Don't increment if already done

        try {
            const response = await axios.post(`/api/property/${id}/view`);
            if (response.data && response.data.success) {
                setLocalViews(response.data.views);
                setViewIncremented(true);
                console.log("View count incremented successfully:", response.data.views);
            }
        } catch (error) {
            console.error("Failed to increment view count:", error);
        }
    };

    // Ensure proper video state when active status changes
    useEffect(() => {
        if (!internalVideoRef.current) return;

        if (isActive && activeIndex === 0 && !userPaused) {
            // Increment view when video becomes active
            if (!viewIncremented) {
                incrementViewCount();
            }

            const playPromise = internalVideoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(() => setIsPlaying(false));
            }
        } else {
            internalVideoRef.current.pause();
            setIsPlaying(false);
            if (!isActive) {
                internalVideoRef.current.muted = true;
            }
        }
    }, [isActive, activeIndex, userPaused, viewIncremented]);

    // Handle like toggle using Redux
    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        try {
            const resultAction = await dispatch(toggleLike(id)).unwrap();
            if (onLikeToggle) {
                onLikeToggle(resultAction.isLiked, resultAction.count);
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    // Function to determine the content type based on index
    const getContentType = (index: number): 'video' | 'photo' | 'location' => {
        if (index === 0) return 'video';
        if (index === locationIndex) return 'location';
        return 'photo';
    };

    // Improved video play/pause control with proper state synchronization
    const togglePlay = () => {
        if (!internalVideoRef.current) return;

        if (internalVideoRef.current.paused) {
            setUserPaused(false);

            // Increment view when user plays video
            if (!viewIncremented) {
                incrementViewCount();
            }

            const playPromise = internalVideoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsPlaying(true))
                    .catch(error => {
                        console.error("Failed to play video:", error);
                        setIsPlaying(false);
                    });
            }
        } else {
            setUserPaused(true);
            internalVideoRef.current.pause();
            setIsPlaying(false);
        }
    };

    // Handle navigation with content type checking and immediate scrolling
    const navigateTo = (newIndex: number) => {
        setActiveIndex(newIndex);
        const currentType = getContentType(activeIndex);
        const newType = getContentType(newIndex);

        if (currentType !== newType) {
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 400);
        }

        // Always ensure video is paused when navigating away from video
        if (newIndex !== 0 && internalVideoRef.current) {
            internalVideoRef.current.pause();
            setIsPlaying(false);
        }
    };

    // Rest of your component code remains the same...

    // Touch handling
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

        setTouchStart(0);
        setTouchEnd(0);
    };

    // Mouse drag handling
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStartX(e.clientX);
    };

    const handleMouseMove = () => {
        if (!isDragging) return;
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const dragEndX = e.clientX;
        const dragDistance = dragStartX - dragEndX;

        if (Math.abs(dragDistance) > dragThreshold) {
            if (dragDistance > 0 && activeIndex < totalItems - 1) {
                navigateTo(activeIndex + 1);
            } else if (dragDistance < 0 && activeIndex > 0) {
                navigateTo(activeIndex - 1);
            }
        }
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Navigation shortcuts
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
        const styleElement = document.createElement('style');
        styleElement.textContent = pulseGradientKeyframes;
        document.head.appendChild(styleElement);
        return () => {
            document.head.removeChild(styleElement);
        };
    }, [pulseGradientKeyframes]);

    // Prevent default behavior for mouse events
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

    // Handle comment click
    const handleCommentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onCommentClick) {
            if (internalVideoRef.current) {
                internalVideoRef.current.pause();
                setIsPlaying(false);
            }
            onCommentClick();
        }
    };

    // Handle more options click
    const handleMoreOptionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        alert("More options clicked");
    };

    // Helper function to parse property tags safely
    const parsePropertyTags = (value: string | string[] | undefined): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value;

        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                // If JSON parsing fails, try comma separation
                return value.split(',').map(item => item.trim()).filter(Boolean);
            }
        }

        return [];
    };

    // Parse preferences and features
    const parsedPreferences = parsePropertyTags(propertyPreferences);
    const parsedFeatures = parsePropertyTags(propertyFeatures);

    // Create property data for tags component
    const propertyData = {
        id,
        title,
        caption,
        rooms,
        propertyType,
        space,
        videoUrl,
        photos,
        propertyPreferences: parsedPreferences,
        propertyFeatures: parsedFeatures
    };

    // Check if we have any preference or feature tags to show
    const hasPreferenceOrFeatureTags = parsedPreferences.length > 0 || parsedFeatures.length > 0;

    return (
        <div className={`relative h-full rounded-xl overflow-hidden bg-black shadow-lg ${isActive ? 'ring-1 ring-blue-500' : ''}`}>
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
                        ref={(el) => {
                            internalVideoRef.current = el;
                            if (typeof videoRef === 'function') {
                                videoRef(el);
                            } else if (videoRef && 'current' in videoRef) {
                                videoRef.current = el;
                            }
                        }}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted={!isActive}
                        playsInline
                        preload="metadata"
                        onClick={togglePlay}
                    />
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center" onClick={togglePlay}>
                            <div className="bg-black bg-opacity-40 rounded-full p-4">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Photo items */}
                {photos.map((photo, index) => (
                    <div
                        key={photo.id || `photo-${index}`}
                        className="min-w-full w-full h-full flex-shrink-0 snap-center relative"
                    >
                        <img
                            src={photo.photoUrl}
                            alt={`Property photo ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}

                {/* Location section */}
                <div className="min-w-full w-full h-full flex-shrink-0 snap-center relative bg-black">
                    <div className="w-full h-full bg-gray-800">
                        <img
                            src={`https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/pin-l+fa0(${location.coordinates?.lng},${location.coordinates?.lat})/${location.coordinates?.lng},${location.coordinates?.lat},13,0/800x1000?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA`}
                            alt="Property location map"
                            className="w-full h-full object-cover opacity-80"
                        />
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

            {/* Carousel indicators */}
            <CarouselIndicators
                totalItems={totalItems}
                activeIndex={activeIndex}
                onClick={goToItem}
            />

            {/* Mid-screen navigation arrows - ONLY for external button mode */}
            {externalButtons && (
                <>
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
                        {(isPhotoMode || isLocationMode) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isLocationMode) {
                                        goToPhotos();
                                    } else {
                                        goToVideo();
                                    }
                                }}
                                className="backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center w-10 h-10"
                                aria-label={isLocationMode ? "View photos" : "View video"}
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
                        {(isVideoMode || isPhotoMode) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isVideoMode) {
                                        goToPhotos();
                                    } else {
                                        goToLocation();
                                    }
                                }}
                                className="backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center w-10 h-10"
                                aria-label={isVideoMode ? "View photos" : "View location"}
                            >
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        )}
                    </div>
                </>
            )}

            {/* Left side with dummy buttons for symmetry */}
            <div className="absolute left-4 bottom-24 flex flex-col items-center space-y-4 z-10">
                {/* Left arrow - using same wrapper structure as right side */}
                <div className="relative flex items-center justify-center" style={{ height: '34px', width: '34px' }}>
                    {!externalButtons && (isPhotoMode || isLocationMode) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isLocationMode) {
                                    goToPhotos();
                                } else {
                                    goToVideo();
                                }
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

                    {/* Placeholder for when arrow is hidden */}
                    {(!externalButtons && !(isPhotoMode || isLocationMode)) && (
                        <div style={{ width: '34px', height: '34px' }} className="opacity-0"></div>
                    )}
                </div>

                {/* Placeholders to match the right side buttons */}
                <div className="opacity-0 pointer-events-none" style={{ width: '40px', height: '40px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
                {/* New placeholder for More Options button */}
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '34px' }}></div>
            </div>

            {/* Right side action buttons */}
            {!externalButtons && (
                <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-4 z-10">
                    {/* Right arrow */}
                    <div className="relative flex items-center justify-center" style={{ height: '34px', width: '34px' }}>
                        {(isVideoMode || isPhotoMode) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isVideoMode) {
                                        goToPhotos();
                                    } else {
                                        goToLocation();
                                    }
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

                        {/* Placeholder */}
                        {!(isVideoMode || isPhotoMode) && (
                            <div style={{ width: '34px', height: '34px' }} className="opacity-0"></div>
                        )}
                    </div>

                    {/* User icon */}
                    <UserProfile
                        avatarUrl={avatarUrl}
                        username={username || ''}
                        userId={userId}
                        linkToProfile={true}
                    />

                    {/* Like button - Now using Redux state */}
                    <LikeButton
                        isLiked={likeState.isLiked}
                        isLoading={isLikeLoading}
                        count={likeState.count}
                        onToggle={handleLikeToggle}
                    />

                    {/* Comment button */}
                    <CommentButton
                        count={commentsCount}
                        onClick={handleCommentClick}
                    />

                    {/* Share button */}
                    <ShareButton
                        id={id}
                        title="Check out this property!"
                        text={`${caption.substring(0, 50)}${caption.length > 50 ? '...' : ''}`}
                    />

                    {/* More Options button */}
                    <button
                        onClick={handleMoreOptionsClick}
                        className="backdrop-blur-lg bg-transparent rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                        </svg>
                    </button>
                </div>
            )}

            {/* Content type indicator */}
            <ContentTypeIndicator
                isVideoMode={isVideoMode}
                isPhotoMode={isPhotoMode}
                isLocationMode={isLocationMode}
                activeIndex={activeIndex}
                photosLength={photos.length}
                isAnimating={isAnimating}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>

            {/* Top right info */}
            <div className="absolute top-4 right-4 z-30 flex space-x-2">
                {location.city && (
                    <div className="backdrop-blur-lg bg-black/30 rounded-full px-3 py-1.5 border border-white/20 flex items-center">
                        <svg className="w-3.5 h-3.5 text-amber-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                        </svg>
                        <span className="text-white text-xs font-medium">{location.city}</span>
                    </div>
                )}
                <div className="backdrop-blur-lg bg-black/30 rounded-full px-3 py-1.5 border border-white/20 flex items-center space-x-1">
                    <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white text-xs font-medium">{localViews}</span>
                </div>
            </div>

            {/* Top banner */}
            <div className="absolute top-16 left-4 right-4 z-30 flex justify-center">
                <div className="flex space-x-2 backdrop-blur-lg bg-white/10 rounded-full px-3 py-1.5 border border-white/20">
                    <div className="flex items-center text-white text-xs font-medium">
                        <svg className="w-3.5 h-3.5 mr-1 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{capitalize(propertyType)}</span>
                    </div>
                    <span className="text-gray-400">|</span>
                    <div className="flex items-center text-white text-xs font-medium">
                        <svg className="w-3.5 h-3.5 mr-1 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>{rooms} room{rooms !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-gray-400">|</span>
                    <div className="flex items-center text-white text-xs font-medium">
                        <svg className="w-3.5 h-3.5 mr-1 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>{space} m²</span>
                    </div>
                </div>
            </div>

            {/* Property title */}
            <div className={`absolute ${hasPreferenceOrFeatureTags ? 'bottom-24' : 'bottom-16'} left-4 right-12 z-10`}>
                <p className="text-white text-base font-semibold">{title}</p>
            </div>

            {/* Caption */}
            <div className={`absolute ${hasPreferenceOrFeatureTags ? 'bottom-18' : 'bottom-10'} left-4 right-12 z-10`}>
                <p className="text-white/80 text-sm line-clamp-1">{caption}</p>
            </div>

            {/* Bottom tags using DynamicPropertyTags component - only show if we have preference/feature tags */}
            {hasPreferenceOrFeatureTags && (
                <div className="absolute bottom-2 left-4 right-4 z-20">
                    <DynamicPropertyTags property={propertyData} maxTagsToShow={5} />
                </div>
            )}
        </div>
    );
}