import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from "../../../../Features/auth";

// Import components but NOT ArrowButton
import {
    CarouselIndicators,
    CommentButton,
    ContentTypeIndicator,
    LikeButton,
    PropertyInfoTags,
    UserProfile,
    LikeService,
} from '../..';

// Import from shared
import { ShareButton } from "../../../../shared";

// Import types
import { VideoCardProperty } from '../../types/Property';

// Additional props specific to the VideoCard component
type VideoCardProps = VideoCardProperty & {
    onCommentClick?: () => void;
    externalButtons?: boolean;
    onLikeToggle?: (isLiked: boolean, likesCount: number) => void;
    title?: string;
    videoRef?: React.Ref<HTMLVideoElement>; // Accept video ref from parent
    isActive?: boolean; // Mark if this card is active
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
    onLikeToggle,
    title = "Magnifique appartement lumineux au cœur de Lyon",
    videoRef, // External ref for video element
    isActive = false // Whether this video is the active one
}: VideoCardProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [commentsCount] = useState(comments);
    const [likeCount, setLikeCount] = useState(likes);
    const [isLiked, setIsLiked] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    const auth = useContext(AuthContext);

    // Touch handling
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const dragThreshold = 100;

    const carouselRef = useRef<HTMLDivElement>(null);
    const internalVideoRef = useRef<HTMLVideoElement>(null);

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

    // FIX: Ensure proper video state when active status changes
    useEffect(() => {
        if (!internalVideoRef.current) return;

        if (isActive) {
            // When this card becomes active
            if (activeIndex === 0) { // Only auto-play if in video mode
                // Try to play video when active
                const playPromise = internalVideoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            setIsPlaying(true);
                        })
                        .catch(() => {
                            setIsPlaying(false);
                        });
                }
            }
        } else {
            // When this card becomes inactive, FORCE pause and update state
            internalVideoRef.current.pause();
            internalVideoRef.current.muted = true; // Ensure muted when inactive
            setIsPlaying(false);
        }
    }, [isActive, activeIndex]);

    // FIX: Make sure video is paused when the carousel is not showing the video
    useEffect(() => {
        if (!internalVideoRef.current) return;

        if (activeIndex === 0) {
            // In video mode, we can play if active
            if (isActive && isPlaying) {
                internalVideoRef.current.play();
            }
        } else {
            // Not in video mode, always pause
            internalVideoRef.current.pause();
            setIsPlaying(false);
        }
    }, [activeIndex, isActive, isPlaying]);

    // Handle like toggle
    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!auth?.authState.isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        setIsLikeLoading(true);
        try {
            const response = await LikeService.toggleLike(id);
            if (response.isSuccess) {
                setIsLiked(response.isLiked);
                setLikeCount(response.likesCount);
                if (onLikeToggle) {
                    onLikeToggle(response.isLiked, response.likesCount);
                }
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

    // FIX: Improved video play/pause control with proper state synchronization
    const togglePlay = () => {
        if (!internalVideoRef.current) return;

        if (internalVideoRef.current.paused) {
            // Try to play the video
            const playPromise = internalVideoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        setIsPlaying(true);
                    })
                    .catch(error => {
                        console.error("Failed to play video:", error);
                        setIsPlaying(false);
                    });
            }
        } else {
            // Pause the video
            internalVideoRef.current.pause();
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
        setActiveIndex(newIndex);
        const currentType = getContentType(activeIndex);
        const newType = getContentType(newIndex);

        if (currentType !== newType) {
            setIsAnimating(true);
            setTimeout(() => {
                setIsAnimating(false);
            }, 400);
        }

        // FIX: Always ensure video is paused when navigating away from video
        if (newIndex !== 0 && internalVideoRef.current) {
            internalVideoRef.current.pause();
            setIsPlaying(false);
        }
    };

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
    }, []);

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

    // FIX: Handle direct video events to ensure state synchronization
    const handleVideoPlay = () => {
        setIsPlaying(true);
    };

    const handleVideoPause = () => {
        setIsPlaying(false);
    };

    const handleVideoEnded = () => {
        // Video reached the end, restart it (since loop is enabled)
        if (internalVideoRef.current && isActive) {
            internalVideoRef.current.play().catch(() => {
                setIsPlaying(false);
            });
        }
    };

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
                        // Using a callback ref to handle both internal and external refs
                        ref={(el) => {
                            // Set internal ref first
                            internalVideoRef.current = el;

                            // Then handle external ref based on its type
                            if (typeof videoRef === 'function') {
                                videoRef(el);  // Function ref
                            } else if (videoRef) {
                                // Object ref
                                (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
                            }
                        }}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        loop
                        muted={!isActive} // Only unmute if active
                        playsInline
                        preload="metadata"
                        onClick={togglePlay}
                        onPlay={handleVideoPlay}
                        onPause={handleVideoPause}
                        onEnded={handleVideoEnded}
                    />
                    {/* Play/Pause overlay button */}
                    <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}
                        onClick={e => {
                            e.stopPropagation();
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

            {/* Rest of your component remains the same */}
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

            {/* Left side - Updated to include the left arrow */}
            <div className="absolute left-4 bottom-24 flex flex-col items-center space-y-4 z-10">
                {/* Left arrow - Now positioned on the left side */}
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

                {/* Placeholders to maintain spacing */}
                <div className="opacity-0 pointer-events-none" style={{ width: '40px', height: '40px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
                <div className="opacity-0 pointer-events-none" style={{ width: '34px', height: '48px' }}></div>
            </div>

            {/* Right side action buttons - only shown if not using external buttons */}
            {!externalButtons && (
                <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-4 z-10">
                    {/* RIGHT SIDE: Right arrow only (left arrow moved to left side) */}
                    <div className="relative flex items-center justify-center" style={{ height: '34px', width: '34px' }}>
                        {/* Right arrow - in the normal position */}
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

                        {/* Invisible placeholder when no right arrow is visible */}
                        {!(isVideoMode || isPhotoMode) && (
                            <div style={{ width: '34px', height: '34px' }} className="opacity-0"></div>
                        )}
                    </div>

                    {/* User icon */}
                    <UserProfile
                        avatarUrl={avatarUrl}
                        username={username}
                    />

                    {/* Like button */}
                    <LikeButton
                        isLiked={isLiked}
                        isLoading={isLikeLoading}
                        count={likeCount}
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
                        className="backdrop-blur-lg bg-transparent rounded-full p-1.5 hover:bg-green-500/30 transition-all border border-white/20 flex items-center justify-center"
                        iconClassName="w-5 h-5 text-white"
                        textClassName="text-white text-xs font-medium mt-2"
                    />
                </div>
            )}

            {/* Media type indicator with animation */}
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

            {/* Property info tags */}
            <PropertyInfoTags
                rooms={rooms}
                propertyType={propertyType}
                space={space}
            />

            {/* Caption */}
            <div className="absolute bottom-20 left-4 right-12 z-10">
                <p className="text-white text-sm line-clamp-1">{caption}</p>
            </div>

            {/* Property title */}
            <div className="absolute bottom-2 left-4 right-12 z-10">
                <p className="text-white text-sm font-medium">{title}</p>
            </div>
        </div>
    );
}