import { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import {
    fetchProperties,
    checkAllLikeStatuses,
    toggleLike,
    setActiveVideoIndex,
    toggleComments,
    setActiveProperty,
    updatePropertyLike
} from "../../../store/slices/propertySlice";
import { CommentPanel } from "../../../shared";
import { PropertyList } from "..";

export default function Feed() {
    const dispatch = useAppDispatch();
    const {
        properties,
        propertyLikes,
        likeLoading,
        activeVideoIndex,
        activePropertyId,
        isLoading,
        error,
        showComments
    } = useAppSelector(state => state.property);
    const { isAuthenticated } = useAppSelector(state => state.auth);

    // Layout state - still kept locally as it's UI related
    const [hasLargeLayout, setHasLargeLayout] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);

    // Comment panel width and animation offset
    const commentPanelWidth = windowWidth < 1400 ? 500 : 580;
    const slideOffset = 75;

    // Breakpoints for responsive layout
    const LARGE_LAYOUT_BREAKPOINT = 1280;
    const MEDIUM_LAYOUT_BREAKPOINT = 768;
    const SMALL_LAYOUT_BREAKPOINT = 480;

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

    // Fetch properties on component mount
    useEffect(() => {
        dispatch(fetchProperties());
    }, [dispatch]);

    // Check like statuses when properties are loaded or auth changes
    useEffect(() => {
        if (isAuthenticated && properties.length > 0) {
            dispatch(checkAllLikeStatuses());
        }
    }, [dispatch, isAuthenticated, properties.length]);

    // Handle comment toggle
    const handleToggleComments = (propertyId: string) => {
        dispatch(setActiveProperty(propertyId));
        dispatch(toggleComments(true));
    };

    // Handle like toggle
    const handleLikeToggle = async (propertyId: string) => {
        if (!isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        dispatch(toggleLike(propertyId));
    };

    // Handle external like toggle - this is called from VideoCard
    const handleVideoCardLikeToggle = (propertyId: string, isLiked: boolean, count: number) => {
        dispatch(updatePropertyLike({ propertyId, isLiked, count }));
    };

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

    // Set active video index when video is in view
    const handleVideoInView = (index: number) => {
        dispatch(setActiveVideoIndex(index));
    };

    // Update UI based on active video
    useEffect(() => {
        if (properties.length > 0 && activeVideoIndex >= 0 && activeVideoIndex < properties.length) {
            const activeProperty = properties[activeVideoIndex];

            // Update document title with current property
            document.title = `Reelstate - ${activeProperty.caption.substring(0, 30)}${activeProperty.caption.length > 30 ? '...' : ''}`;

            // Update URL without page reload (for sharing)
            if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
                const newUrl = `/feed?property=${activeProperty.id}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            }
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
                        onClick={() => dispatch(fetchProperties())}
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
                            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                        >
                            Create Listing
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-black h-screen overflow-hidden">
            <div className="h-[calc(100vh-55px)] overflow-hidden" ref={containerRef}>
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
                        activeVideoIndex={activeVideoIndex}
                    />
                </div>

                {activePropertyId && (
                    <>
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
                                    onClose={() => dispatch(toggleComments(false))}
                                    displayMode="sidebar"
                                />
                            </div>
                        )}

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
                                        onClose={() => dispatch(toggleComments(false))}
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