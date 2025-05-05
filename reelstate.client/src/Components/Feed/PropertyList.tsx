import React, { useRef } from 'react';
import VideoCard from '../VideoCard';
import PropertyActions from './PropertyActions';
import { VideoCardProperty, PropertyLikeState, PropertyLoadingState } from '../../Types/ComponentTypes';

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
    handleLikeToggle
}) => {
    const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Initialize refs
    React.useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, properties.length);
    }, [properties]);

    return (
        <div className="snap-y snap-mandatory overflow-y-auto h-full bg-gray-100">
            {properties.map((property, index) => {
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
                                    onCommentClick={() => onToggleComments(property.id)}
                                    externalButtons={hasLargeLayout}
                                    onLikeToggle={(isLiked, count) => onLikeToggle(property.id, isLiked, count)}
                                />
                            </div>

                            {/* External Action Buttons - Inside the shared container */}
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