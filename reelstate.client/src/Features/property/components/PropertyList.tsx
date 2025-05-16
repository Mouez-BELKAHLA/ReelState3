import React, { useRef, useEffect, useState } from 'react';
import VideoCard from './VideoCard/VideoCard';
import PropertyActions from './PropertyActions';
import { VideoCardProperty, PropertyLikeState, PropertyLoadingState } from '..';

interface PropertyListProps {
    properties: VideoCardProperty[];
    propertyLikes: PropertyLikeState;
    isLikeLoading: PropertyLoadingState;
    showComments: boolean;
    hasLargeLayout: boolean;
    slideOffset: number;
    getVideoWidth: () => string;
    onVideoInView: (index: number) => void;
    onLikeToggle: (propertyId: string, isLiked: boolean, count: number) => void;
    onToggleComments: (propertyId: string) => void;
    handleLikeToggle: (propertyId: string) => Promise<void>;
    activeVideoIndex: number;
}

const PropertyList: React.FC<PropertyListProps> = ({
    properties,
    propertyLikes,
    isLikeLoading,
    showComments,
    hasLargeLayout,
    slideOffset,
    getVideoWidth,
    onVideoInView,
    onLikeToggle,
    onToggleComments,
    handleLikeToggle,
    activeVideoIndex
}) => {
    const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
    const videoElementRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // Store the video width in state to ensure it's consistent across renders
    const [videoWidth, setVideoWidth] = useState(() => getVideoWidth());

    // Update video width on layout change
    useEffect(() => {
        setVideoWidth(getVideoWidth());
    }, [hasLargeLayout, getVideoWidth]);

    // Initialize refs
    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, properties.length);
        videoElementRefs.current = videoElementRefs.current.slice(0, properties.length);
    }, [properties]);

    // Set up IntersectionObserver to detect when videos are in view
    useEffect(() => {
        const observers: IntersectionObserver[] = [];

        videoRefs.current.forEach((ref, index) => {
            if (!ref) return;

            const observer = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries;
                    if (entry.isIntersecting) {
                        // Call the onVideoInView callback when a video comes into view
                        onVideoInView(index);
                    }
                },
                { threshold: 0.6 } // Consider the video "in view" when 60% is visible
            );

            observer.observe(ref);
            observers.push(observer);
        });

        // Clean up observers when component unmounts
        return () => {
            observers.forEach(observer => {
                observer.disconnect();
            });
        };
    }, [properties, onVideoInView]);

    /// Control video playback based on active index
    useEffect(() => {
        // Find all video elements within the video cards
        const videoElements = videoElementRefs.current;

        // Pause all videos except the active one
        videoElements.forEach((videoEl, idx) => {
            if (videoEl) {
                if (idx === activeVideoIndex) {
                    // For the active video, only attempt to play if it's already supposed to be playing
                    // This avoids forcing it to play automatically
                    // The individual VideoCard will handle actual play/pause logic
                    if (!videoEl.paused) {
                        videoEl.play().catch(() => { });
                    }
                    videoEl.muted = false; // Ensure active video is unmuted
                } else {
                    // For all other videos, ALWAYS pause and mute
                    videoEl.pause();
                    videoEl.muted = true;
                    videoEl.currentTime = 0; // Reset to beginning
                }
            }
        });
    }, [activeVideoIndex]);

    return (
        <div className="snap-y snap-mandatory overflow-y-auto h-full bg-gray-100">
            {properties.map((property, index) => {
                const propertyLikeState = propertyLikes[property.id] || { count: property.likes, isLiked: false };
                const isActive = index === activeVideoIndex;

                return (
                    <div
                        key={property.id}
                        ref={(el) => { videoRefs.current[index] = el }}
                        className={`snap-start snap-always w-full py-1.5 flex justify-center ${isActive ? 'active-property' : ''}`}
                        style={{ height: 'calc(100vh - 105px)' }}
                    >
                        {/* Content wrapper with fixed width */}
                        <div
                            className="relative flex justify-center transition-transform duration-500 ease-in-out"
                            style={{
                                transform: hasLargeLayout && showComments ? `translateX(-${slideOffset}px)` : 'translateX(0)'
                            }}
                        >
                            {/* Video Card Component - using fixed width across all cards - removed ring-2 ring-blue-500 */}
                            <div
                                className="h-full rounded-lg overflow-hidden"
                                style={{
                                    width: videoWidth,
                                    minWidth: videoWidth,
                                    maxWidth: videoWidth
                                }}
                            >
                                <VideoCard
                                    {...property}
                                    likes={propertyLikeState.count}
                                    onCommentClick={() => onToggleComments(property.id)}
                                    externalButtons={hasLargeLayout}
                                    onLikeToggle={(isLiked, count) => onLikeToggle(property.id, isLiked, count)}
                                    videoRef={(el) => { videoElementRefs.current[index] = el }}
                                    isActive={isActive}
                                />
                            </div>

                            {/* External Action Buttons */}
                            {hasLargeLayout && (
                                <div className="absolute right-[-70px] top-1/2 transform -translate-y-1/2 z-30">
                                    <PropertyActions
                                        property={{ ...property, likes: propertyLikeState.count }}
                                        isLiked={propertyLikeState.isLiked}
                                        isLoading={isLikeLoading[property.id] || false}
                                        onLikeToggle={() => handleLikeToggle(property.id)}
                                        onCommentClick={() => onToggleComments(property.id)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default PropertyList;