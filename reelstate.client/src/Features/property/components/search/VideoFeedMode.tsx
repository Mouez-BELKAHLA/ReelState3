import React, { useRef, useState } from 'react';
import { useAppDispatch } from '../../../../store/hooks';
import { setShowNavbar } from '../../../../store/slices/uiSlice';
import { PropertyList } from '../PropertyList';
import { CommentPanel } from "../../../../shared";

interface VideoFeedModeProps {
    properties: any[];
    activeVideoIndex: number;
    showComments: boolean;
    activePropertyId: string;
    hasLargeLayout: boolean;
    isMobile: boolean;
    showNavbar: boolean;
    commentPanelWidth: number;
    slideOffset: number;
    getVideoWidth: () => string;
    onCloseVideoMode: () => void;
    onToggleComments: (propertyId: string) => void;
    onVideoInView: (index: number) => void;
}

export const VideoFeedMode: React.FC<VideoFeedModeProps> = ({
    properties,
    activeVideoIndex,
    showComments,
    activePropertyId,
    hasLargeLayout,
    isMobile,
    showNavbar,
    commentPanelWidth,
    slideOffset,
    getVideoWidth,
    onCloseVideoMode,
    onToggleComments,
    onVideoInView
}) => {
    const dispatch = useAppDispatch();
    const containerRef = useRef<HTMLDivElement>(null);
    const [previousIndex, setPreviousIndex] = useState(-1);
    const [sessionViewedVideos, setSessionViewedVideos] = useState<Set<string>>(new Set());
    const [viewLoading, setViewLoading] = useState<{ [key: string]: boolean }>({});
    const [propertyLikes, setPropertyLikes] = useState<{ [key: string]: { isLiked: boolean, count: number } }>({});
    const [likeLoading, setLikeLoading] = useState<{ [key: string]: boolean }>({});

    // Handle showing navbar toggle
    const handleShowNavbar = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to container
        dispatch(setShowNavbar(true));
    };

    // Video navigation handling
    const handleVideoInView = (index: number) => {
        // If we're moving to a new video
        if (index !== previousIndex) {
            // Hide navbar when switching to a new property (only on mobile)
            if (isMobile) {
                dispatch(setShowNavbar(false));
            }
            setPreviousIndex(index);
        }

        onVideoInView(index);
    };

    // Placeholder for incrementViewCount
    const incrementViewCount = async (propertyId: string) => {
        if (!propertyId || sessionViewedVideos.has(propertyId) || viewLoading[propertyId]) {
            return;
        }

        try {
            setViewLoading(prev => ({ ...prev, [propertyId]: true }));
            console.log(`Incrementing view for property: ${propertyId} (first play)`);

            // Placeholder for actual API call
            // const response = await axios.post(`${API_URL}/api/Property/${propertyId}/view`);

            // Update the viewed videos set
            setSessionViewedVideos(prev => new Set([...prev, propertyId]));
        } catch (error) {
            console.error('Error incrementing view count:', error);
        } finally {
            setViewLoading(prev => ({ ...prev, [propertyId]: false }));
        }
    };

    // Handle video card like toggle
    const handleVideoCardLikeToggle = (propertyId: string, isLiked: boolean, count: number) => {
        setPropertyLikes(prev => ({
            ...prev,
            [propertyId]: { isLiked, count }
        }));
    };

    // Get container height based on navbar visibility
    const getContainerHeight = () => {
        if (!isMobile) {
            return 'calc(100vh - 55px)'; // Always leave space for navbar on desktop
        }
        return showNavbar ? 'calc(100vh - 55px)' : '100vh'; // Dynamic on mobile
    };

    return (
        <div className="bg-black h-screen overflow-hidden">
            {/* Back button to return to search */}
            <div className="back-to-search" onClick={onCloseVideoMode}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
                        onToggleComments={onToggleComments}
                        handleLikeToggle={handleVideoCardLikeToggle}
                        activeVideoIndex={activeVideoIndex}
                        onVideoPlay={incrementViewCount}
                    />
                </div>

                {activePropertyId && (
                    <>
                        {hasLargeLayout && (
                            <div
                                className="fixed right-0 bottom-0 z-40 shadow-xl border-l border-gray-200 bg-white comment-panel-slide"
                                style={{
                                    width: `${commentPanelWidth}px`,
                                    top: '55px', // Always account for navbar on desktop
                                    transform: showComments ? 'translateX(0)' : 'translateX(100%)',
                                    transition: 'transform 400ms cubic-bezier(0.33, 1, 0.68, 1)'
                                }}
                            >
                                <CommentPanel
                                    propertyId={activePropertyId}
                                    onClose={() => onToggleComments('')}
                                    displayMode="sidebar"
                                />
                            </div>
                        )}

                        {!hasLargeLayout && showComments && (
                            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center animate-fadeIn">
                                <div
                                    className="fixed bg-white rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
                                    style={{
                                        maxHeight: '85vh',
                                        width: '95%',
                                        maxWidth: '480px',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <CommentPanel
                                        propertyId={activePropertyId}
                                        onClose={() => onToggleComments('')}
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
};