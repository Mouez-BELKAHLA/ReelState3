import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProperties, clearSearchResults, checkLikeStatus, toggleLike, updatePropertyLike, setActiveVideoIndex, toggleComments, setActiveProperty } from '../../../store/slices/propertySlice';
import { searchWithAI, setQuery } from '../../../store/slices/aiSlice';
import { SearchFilters } from '../types/Property';
import { PropertyList } from '..';
import { CommentPanel } from "../../../shared";
import { setShowNavbar } from '../../../store/slices/uiSlice';
import axios from 'axios';
import { API_URL } from "../../../shared";

// Embedded SVG placeholders instead of external URL dependencies
const SVG_PLACEHOLDERS = {
    DEFAULT: `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Crect fill='%23d0d0d0' x='75' y='50' width='150' height='120' rx='2'/%3E%3Crect fill='%23f8f8f8' x='100' y='80' width='40' height='30'/%3E%3Crect fill='%23f8f8f8' x='160' y='80' width='40' height='30'/%3E%3Crect fill='%23f8f8f8' x='100' y='120' width='40' height='30'/%3E%3Crect fill='%23f8f8f8' x='160' y='120' width='40' height='30'/%3E%3Ctext x='150' y='180' font-family='Arial' font-size='12' text-anchor='middle' fill='%23666'%3EProperty%3C/text%3E%3C/svg%3E`,
    APARTMENT: `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Crect fill='%23d4d6ff' x='75' y='30' width='150' height='140' rx='2'/%3E%3Crect fill='%23f8f8f8' x='95' y='50' width='25' height='20'/%3E%3Crect fill='%23f8f8f8' x='135' y='50' width='25' height='20'/%3E%3Crect fill='%23f8f8f8' x='175' y='50' width='25' height='20'/%3E%3Crect fill='%23f8f8f8' x='95' y='90' width='25' height='20'/%3E%3Crect fill='%23f8f8f8' x='135' y='90' width='25' height='20'/%3E%3Crect fill='%23f8f8f8' x='175' y='90' width='25' height='20'/%3E%3Crect fill='%23f8f8f8' x='95' y='130' width='25' height='20'/%3E%3Crect fill='%23f8f8f8' x='135' y='130' width='60' height='40'/%3E%3Ctext x='150' y='180' font-family='Arial' font-size='12' text-anchor='middle' fill='%23666'%3EApartment%3C/text%3E%3C/svg%3E`,
    HOUSE: `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Cpolygon fill='%23e0f0e0' points='150,40 60,100 60,170 240,170 240,100'/%3E%3Cpolygon fill='%23c0e0c0' points='150,40 60,100 240,100'/%3E%3Crect fill='%23a0c0a0' x='130' y='120' width='40' height='50'/%3E%3Crect fill='%23f8f8f8' x='90' y='120' width='30' height='25'/%3E%3Crect fill='%23f8f8f8' x='180' y='120' width='30' height='25'/%3E%3Ctext x='150' y='180' font-family='Arial' font-size='12' text-anchor='middle' fill='%23666'%3EHouse%3C/text%3E%3C/svg%3E`,
    USER: `data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e6e6ff'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%23b3b3ff'/%3E%3Cpath d='M10,35 C10,25 30,25 30,35' fill='%23b3b3ff'/%3E%3C/svg%3E`
};

// Helper to capitalize first letter 
const capitalize = (str: string): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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
const SearchResults: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Regular search results state
    const {
        searchResults,
        isSearching,
        error,
        searchQuery,
        currentFilters,
        pagination,
        propertyLikes,
        likeLoading,
        activeVideoIndex,
        activePropertyId,
        showComments
    } = useAppSelector(state => state.property);

    // AI search state
    const {
        recommendations,
        isLoading: isAiLoading,
        error: aiError,
        showThinkingMode,
        isThinking,
        thinkingProcess
    } = useAppSelector(state => state.ai);

    const { isAuthenticated } = useAppSelector(state => state.auth);
    const { showNavbar } = useAppSelector(state => state.ui);

    // Track whether this is an AI-powered search
    const [isAiSearch, setIsAiSearch] = useState(false);
    // Track AI query input
    const [aiQueryInput, setAiQueryInput] = useState('');
    // Flag to track if we're in video mode or search results mode
    const [isVideoMode, setIsVideoMode] = useState(false);

    // Reference for scrolling to results
    const resultsRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [previousIndex, setPreviousIndex] = useState(-1);

    // State to toggle full thinking process visibility
    const [showFullThinking, setShowFullThinking] = useState(false);

    // Session-based view tracking - only track views when videos actually play
    const [sessionViewedVideos, setSessionViewedVideos] = useState<Set<string>>(new Set());
    const [viewLoading, setViewLoading] = useState<{ [key: string]: boolean }>({});

    // Inline thinking animation state
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const thinkingRef = useRef<NodeJS.Timeout | null>(null);

    // Layout state 
    const [hasLargeLayout, setHasLargeLayout] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Comment panel width and animation offset
    const commentPanelWidth = windowWidth < 1400 ? 500 : 580;
    const slideOffset = 75;

    // Breakpoints for responsive layout
    const LARGE_LAYOUT_BREAKPOINT = 1280;
    const MEDIUM_LAYOUT_BREAKPOINT = 768;
    const SMALL_LAYOUT_BREAKPOINT = 480;
    const MOBILE_BREAKPOINT = 768;
    // Function to increment view count - only called when video actually starts playing
    const incrementViewCount = useCallback(async (propertyId: string) => {
        // Check if already viewed in this session or currently loading
        if (!propertyId || sessionViewedVideos.has(propertyId) || viewLoading[propertyId]) {
            console.log(`View already counted for property ${propertyId} in this session`);
            return;
        }

        try {
            setViewLoading(prev => ({ ...prev, [propertyId]: true }));
            console.log(`Incrementing view for property: ${propertyId} (first play)`);

            const response = await axios.post(`${API_URL}/api/Property/${propertyId}/view`);

            if (response.data.success) {
                // Mark as viewed in this session
                setSessionViewedVideos(prev => new Set([...prev, propertyId]));
                console.log(`View count updated for property ${propertyId}: ${response.data.views}`);
            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
        } finally {
            setViewLoading(prev => ({ ...prev, [propertyId]: false }));
        }
    }, [sessionViewedVideos, viewLoading]);

    // Show navbar by default when entering this component
    useEffect(() => {
        // Make sure navbar is visible when component mounts
        dispatch(setShowNavbar(true));

        // Cleanup - ensure navbar is visible when leaving this component
        return () => {
            dispatch(setShowNavbar(true));
        };
    }, [dispatch]);

    // Add scroll event listener to detect when user scrolls to a new property
    useEffect(() => {
        if (!isVideoMode) return;

        const container = containerRef.current;
        if (!container || !isMobile) return; // Only apply on mobile

        const handleScroll = () => {
            const scrollPosition = container.scrollTop;
            const itemHeight = container.clientHeight;
            const currentIndex = Math.round(scrollPosition / itemHeight);

            // If scrolled to a new item, hide the navbar (only on mobile)
            if (currentIndex !== previousIndex && currentIndex >= 0 && isMobile) {
                dispatch(setShowNavbar(false));
                setPreviousIndex(currentIndex);
            }
        };

        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, [dispatch, previousIndex, isMobile, isVideoMode]);

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
            
            /* Navbar toggle button styles */
            .navbar-toggle {
                position: fixed;
                top: 16px;
                right: 16px;
                z-index: 1000;
                background-color: rgba(0, 0, 0, 0.5);
                color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                opacity: 0;
                visibility: hidden;
            }
            
            .navbar-toggle.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .navbar-toggle:hover {
                background-color: rgba(0, 0, 0, 0.7);
            }
            
            /* Only hide navbar on mobile */
            @media (min-width: 769px) {
                .navbar-toggle {
                    display: none !important;
                }
            }

            /* Back button in video mode */
            .back-to-search {
                position: fixed;
                top: 16px;
                left: 16px;
                z-index: 1000;
                background-color: rgba(0, 0, 0, 0.5);
                color: white;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .back-to-search:hover {
                background-color: rgba(0, 0, 0, 0.7);
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
            setIsMobile(width < MOBILE_BREAKPOINT);

            // On desktop, always show navbar
            if (width >= MOBILE_BREAKPOINT) {
                dispatch(setShowNavbar(true));
            }
        };

        checkLayoutSize();
        window.addEventListener('resize', checkLayoutSize);

        return () => window.removeEventListener('resize', checkLayoutSize);
    }, [dispatch]);

    // Handle like toggle 
    const handleLikeToggle = async (propertyId: string) => {
        if (!propertyId) return;

        if (!isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        try {
            await dispatch(toggleLike(propertyId));
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    // Handle video card like toggle - This updates the like state in Redux
    const handleVideoCardLikeToggle = (propertyId: string, isLiked: boolean, count: number) => {
        if (!propertyId) return;
        dispatch(updatePropertyLike({ propertyId, isLiked, count }));
    };

    // Handle property card click - switch to video mode
    const handlePropertyClick = (property: any, index: number) => {
        if (!property || !property.id) {
            console.error("Invalid property data", property);
            return;
        }

        // Update URL to include the property ID
        const params = new URLSearchParams(searchParams);
        params.set('property', property.id);
        setSearchParams(params);

        // Set active video index for the PropertyList component
        dispatch(setActiveVideoIndex(index));

        // Switch to video mode - this will hide the search controls
        setIsVideoMode(true);
    };

    // Handle comments toggle
    const handleToggleComments = (propertyId: string) => {
        dispatch(setActiveProperty(propertyId));
        dispatch(toggleComments(true));
    };

    // Handle closing the video mode view
    const handleCloseVideoMode = () => {
        // Remove property parameter from URL
        const params = new URLSearchParams(searchParams);
        params.delete('property');
        setSearchParams(params);

        // Exit video mode
        setIsVideoMode(false);

        // Ensure navbar is visible
        dispatch(setShowNavbar(true));

        // Reset active index
        dispatch(setActiveVideoIndex(-1));
    };

    useEffect(() => {
        // Check if this is an AI search from URL
        const isAiParam = searchParams.get('ai') === 'true';
        const aiQuery = searchParams.get('aiQuery') || '';
        const useThinkingMode = true; // Always use thinking mode

        if (isAiParam) {
            setIsAiSearch(true);
            setAiQueryInput(aiQuery);

            // Run AI search - completely separate from filters
            if (aiQuery) {
                console.log("Running AI search with query:", aiQuery);
                dispatch(setQuery(aiQuery));

                // Always use thinking mode
                dispatch(searchWithAI({
                    query: aiQuery,
                    useThinkingMode: useThinkingMode
                }));
            }
        } else {
            // Regular search with filters
            setIsAiSearch(false);
            setAiQueryInput('');

            // Get search parameters from URL
            const query = searchParams.get('q') || '';
            const propertyType = searchParams.get('propertyType');
            const city = searchParams.get('city');
            const minRooms = searchParams.get('minRooms');
            const maxRooms = searchParams.get('maxRooms');
            const minSpace = searchParams.get('minSpace');
            const maxSpace = searchParams.get('maxSpace');
            const sortBy = searchParams.get('sortBy');
            const preferences = searchParams.get('preferences');
            const features = searchParams.get('features');
            const page = searchParams.get('page');

            // Build filters object
            const filters: SearchFilters = {};
            if (query) filters.q = query;
            if (propertyType) filters.propertyType = propertyType;
            if (city) filters.city = city;
            if (minRooms) filters.minRooms = parseInt(minRooms);
            if (maxRooms) filters.maxRooms = parseInt(maxRooms);
            if (minSpace) filters.minSpace = parseInt(minSpace);
            if (maxSpace) filters.maxSpace = parseInt(maxSpace);
            if (sortBy) filters.sortBy = sortBy as SearchFilters['sortBy'];
            if (preferences) filters.preferences = preferences.split(',');
            if (features) filters.features = features.split(',');
            if (page) filters.page = parseInt(page);

            // Only search if we have a query or filters
            if (query || Object.keys(filters).length > 0) {
                dispatch(searchProperties({ query, filters }));
            }
        }

        // Check if we should start in video mode based on URL parameter
        const propertyId = searchParams.get('property');
        setIsVideoMode(!!propertyId);

    }, [searchParams, dispatch]);

    // Check like status for all visible properties
    useEffect(() => {
        if (isAuthenticated) {
            // Check likes for search results
            if (!isAiSearch && searchResults.length > 0) {
                searchResults.forEach(property => {
                    if (property && property.id) {
                        dispatch(checkLikeStatus(property.id));
                    }
                });
            }

            // Check likes for AI recommendations
            if (isAiSearch && recommendations.length > 0) {
                recommendations.forEach(property => {
                    if (property && property.id) {
                        dispatch(checkLikeStatus(property.id));
                    }
                });
            }
        }
    }, [dispatch, isAuthenticated, isAiSearch, searchResults, recommendations]);

    // Thinking animation in search bar area
    useEffect(() => {
        if (isAiLoading || isThinking) {
            const thinkingSteps = [
                `Analyzing your query: "${aiQueryInput}"...`,
                `Searching for properties that match your criteria...`,
                `Evaluating property features and preferences...`,
                `Looking for properties with garden features...`,
                `Finding the best matches for you...`
            ];

            let currentStep = 0;

            const updateThinkingStep = () => {
                setThinkingStep(thinkingSteps[currentStep]);
                currentStep = (currentStep + 1) % thinkingSteps.length;
                thinkingRef.current = setTimeout(updateThinkingStep, 2000);
            };

            updateThinkingStep();

            return () => {
                if (thinkingRef.current) {
                    clearTimeout(thinkingRef.current);
                    setThinkingStep('');
                }
            };
        }
    }, [isAiLoading, isThinking, aiQueryInput]);

    const handleLoadMore = () => {
        if (pagination.hasNextPage) {
            const currentParams = new URLSearchParams(searchParams);
            currentParams.set('page', (pagination.currentPage + 1).toString());
            setSearchParams(currentParams);
        }
    };

    const handleClearSearch = () => {
        dispatch(clearSearchResults());
        navigate('/feed');
    };

    const handleAiSearch = () => {
        if (!aiQueryInput.trim()) return;

        // Don't navigate or reload the page - just update URL parameters
        const params = new URLSearchParams(searchParams);
        params.set('ai', 'true');
        params.set('aiQuery', aiQueryInput);

        // Remove property parameter if present
        params.delete('property');

        // Update search params without navigation
        setSearchParams(params);

        // Exit video mode
        setIsVideoMode(false);

        // Immediately set AI search state
        setIsAiSearch(true);

        // Dispatch AI search action directly
        dispatch(setQuery(aiQueryInput));
        dispatch(searchWithAI({
            query: aiQueryInput,
            useThinkingMode: true // Always use thinking mode
        }));
    };

    // Toggle showing full thinking process
    const toggleFullThinking = () => {
        setShowFullThinking(!showFullThinking);
    };

    // Set active video index when video is in view
    const handleVideoInView = useCallback((index: number) => {
        // If we're moving to a new video
        if (index !== previousIndex) {
            // Hide navbar when switching to a new property (only on mobile)
            if (isMobile) {
                dispatch(setShowNavbar(false));
            }
            setPreviousIndex(index);
        }

        dispatch(setActiveVideoIndex(index));

        // Update URL to indicate current property (for sharing)
        const currentProperties = isAiSearch ? recommendations : searchResults;
        if (currentProperties[index]) {
            const params = new URLSearchParams(searchParams);
            params.set('property', currentProperties[index].id);
            setSearchParams(params);
        }
    }, [previousIndex, isMobile, dispatch, searchParams, setSearchParams, isAiSearch, recommendations, searchResults]);

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

    // Handle navbar toggle
    const handleShowNavbar = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent event from bubbling to container
        dispatch(setShowNavbar(true));
    };

    // Calculate container height based on navbar visibility
    const getContainerHeight = () => {
        if (!isMobile) {
            return 'calc(100vh - 55px)'; // Always leave space for navbar on desktop
        }
        return showNavbar ? 'calc(100vh - 55px)' : '100vh'; // Dynamic on mobile
    };

    // Get the current properties to display based on search type
    const currentProperties = isAiSearch ? recommendations : searchResults;
    // In video mode, show the TikTok-style feed
    if (isVideoMode) {
        return (
            <div className="bg-black h-screen overflow-hidden">
                {/* Back button to return to search */}
                <div className="back-to-search" onClick={handleCloseVideoMode}>
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
                            properties={currentProperties}
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
    }    // In video mode, show the TikTok-style feed
    if (isVideoMode) {
        return (
            <div className="bg-black h-screen overflow-hidden">
                {/* Back button to return to search */}
                <div className="back-to-search" onClick={handleCloseVideoMode}>
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
                            properties={currentProperties}
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
    // Render loading state
    if ((isSearching && !isAiSearch && !currentProperties.length) || (isAiLoading && !currentProperties.length)) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                </div>
            </div>
        );
    }

    // When not in video mode, show the search interface
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isAiSearch ? 'AI Search Results' : 'Search Results'}
                            </h1>
                            {searchQuery && !isAiSearch && (
                                <p className="text-gray-600 mt-1">
                                    Results for "{searchQuery}"
                                </p>
                            )}
                            {isAiSearch && aiQueryInput && (
                                <p className="text-gray-600 mt-1">
                                    AI results for "{aiQueryInput}"
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleClearSearch}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            Back to Feed
                        </button>
                    </div>

                    {/* AI Search Input - Always visible */}
                    <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
                        <div className="flex items-center">
                            <div className="mr-3 flex-shrink-0">
                                <div className="p-2 bg-purple-100 rounded-full">
                                    <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-grow">
                                <label htmlFor="ai-search" className="block text-sm font-medium text-purple-700 mb-1">
                                    Search with AI
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        id="ai-search"
                                        className="block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                                        placeholder="Describe what you're looking for in natural language..."
                                        value={aiQueryInput}
                                        onChange={(e) => setAiQueryInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
                                        disabled={isAiLoading || isThinking}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-r-md hover:bg-purple-700 disabled:opacity-50"
                                        onClick={handleAiSearch}
                                        disabled={isAiLoading || isThinking || !aiQueryInput.trim()}
                                    >
                                        {isAiLoading || isThinking ? (
                                            <span className="flex items-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Thinking
                                            </span>
                                        ) : "Search"}
                                    </button>
                                </div>
                                <div className="mt-2">
                                    {/* Show thinking process, conclusion, or example queries */}
                                    <div className="text-sm">
                                        {(isAiLoading || isThinking) ? (
                                            <p className="text-sm text-purple-700 font-medium animate-pulse">
                                                {thinkingStep}
                                            </p>
                                        ) : (!isAiLoading && thinkingProcess?.conclusion && isAiSearch) ? (
                                            <p className="text-sm text-purple-700 font-bold">
                                                AI's Conclusion: {thinkingProcess.conclusion}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                Try: "I need a modern apartment with sea view" or "Find a family house with garden"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Thinking process indicator dots - only show during thinking */}
                                {isAiSearch && isThinking && (
                                    <div className="mt-3 flex items-center space-x-2">
                                        {[...Array(5)].map((_, i) => (
                                            <span
                                                key={i}
                                                className={`h-2 w-2 rounded-full bg-purple-600 ${i === thinkingProcess?.steps?.length % 5 ? 'animate-pulse' : ''}`}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Show "View full thinking process" button when thinking is complete */}
                                {isAiSearch && !isThinking && !isAiLoading && thinkingProcess?.steps && thinkingProcess.steps.length > 0 && (
                                    <div className="mt-2">
                                        <button
                                            onClick={toggleFullThinking}
                                            className="text-sm text-purple-700 hover:text-purple-900 font-medium flex items-center"
                                        >
                                            {showFullThinking ? 'Hide full thinking process' : 'View full thinking process'}
                                            <svg className={`ml-1 h-4 w-4 transform transition-transform ${showFullThinking ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Full thinking process - only show when expanded */}
                                {showFullThinking && thinkingProcess?.steps && thinkingProcess.steps.length > 0 && (
                                    <div className="mt-3 p-3 bg-white border border-purple-100 rounded-md shadow-sm">
                                        <h4 className="font-medium text-purple-800 mb-2 text-sm">Complete AI Thinking Process</h4>
                                        <div className="space-y-3">
                                            {thinkingProcess.steps.map((step, idx) => (
                                                <div key={idx} className="text-xs text-gray-700">
                                                    <div className="font-medium text-purple-700">Step {step.step}: {step.title}</div>
                                                    <div>{step.description}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Error Message */}
                    {isAiSearch && aiError && (
                        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex">
                                <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className="text-sm font-medium text-red-800">AI Search Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{aiError}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Regular search filters display (only for non-AI searches) */}
                    {!isAiSearch && (
                        <>
                            {/* Results Info */}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>
                                    {pagination.totalCount || 0} properties found
                                </span>
                                <span>
                                    Page {pagination.currentPage || 1} of {pagination.totalPages || 1}
                                </span>
                            </div>

                            {/* Active Filters Display */}
                            {currentFilters && Object.keys(currentFilters).length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <span className="text-sm text-gray-500">Filters:</span>
                                    {currentFilters.propertyType && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Type: {currentFilters.propertyType}
                                        </span>
                                    )}
                                    {currentFilters.city && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            City: {currentFilters.city}
                                        </span>
                                    )}
                                    {currentFilters.minRooms && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Min Rooms: {currentFilters.minRooms}
                                        </span>
                                    )}
                                    {currentFilters.preferences && currentFilters.preferences.length > 0 && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Preferences: {currentFilters.preferences.length}
                                        </span>
                                    )}
                                    {currentFilters.features && currentFilters.features.length > 0 && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                            Features: {currentFilters.features.length}
                                        </span>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Results container */}
                <div ref={resultsRef}>
                    {/* Show results as soon as they're available, even during thinking */}
                    {(isAiSearch ? recommendations.length > 0 : searchResults.length > 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {/* Content loading indicator - show small spinner for just the grid */}
                            {(isSearching || isAiLoading) && (
                                <div className="col-span-full flex justify-center items-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            )}

                            {/* Property Cards */}
                            {(isAiSearch ? recommendations : searchResults).map((property, index) => {
                                if (!property || !property.id) return null;

                                // Use helper functions to get property data
                                const propertyType = property.propertyType || 'Property';

                                // Parse preferences and features for tags
                                const parsedPreferences = parsePropertyTags(property.propertyPreferences);
                                const parsedFeatures = parsePropertyTags(property.propertyFeatures);

                                // Check if we have any preference or feature tags to show
                                const hasPreferenceOrFeatureTags = parsedPreferences.length > 0 || parsedFeatures.length > 0;

                                // Get like state from Redux
                                const likeState = propertyLikes[property.id] || {
                                    isLiked: false,
                                    count: property.likesCount || property.likes || 0
                                };
                                const isLikeLoading = likeLoading[property.id] || false;

                                // Improved city display logic - show city if available
                                const hasCity = Boolean(property.city || (property.location && property.location.city));
                                const cityName = property.city || (property.location && property.location.city) || '';

                                // Get username and userId 
                                const username = property.username || '';

                                return (
                                    <div
                                        key={property.id || `property-${index}`}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => handlePropertyClick(property, index)}
                                    >
                                        {/* Property Video Preview with Fallback to Image */}
                                        <div className="relative h-48 bg-gray-200">
                                            {property.videoUrl ? (
                                                <video
                                                    src={property.videoUrl}
                                                    className="w-full h-full object-cover"
                                                    poster={property.photoUrl || ''}
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                    onError={(e) => {
                                                        // Fall back to image on video load error
                                                        const videoElement = e.target as HTMLVideoElement;
                                                        videoElement.style.display = 'none';
                                                        const imgFallback = document.createElement('img');
                                                        imgFallback.src = property.photoUrl || SVG_PLACEHOLDERS.DEFAULT;
                                                        imgFallback.className = 'w-full h-full object-cover';
                                                        imgFallback.alt = property.title || propertyType;
                                                        videoElement.parentNode?.appendChild(imgFallback);
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src={property.photoUrl || SVG_PLACEHOLDERS.DEFAULT}
                                                    alt={property.title || propertyType}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Replace broken images with placeholder
                                                        const target = e.target as HTMLImageElement;
                                                        if (propertyType.toLowerCase().includes('apartment')) {
                                                            target.src = SVG_PLACEHOLDERS.APARTMENT;
                                                        } else if (propertyType.toLowerCase().includes('house')) {
                                                            target.src = SVG_PLACEHOLDERS.HOUSE;
                                                        } else {
                                                            target.src = SVG_PLACEHOLDERS.DEFAULT;
                                                        }
                                                    }}
                                                />
                                            )}

                                            {/* Top right info - View and Like counts */}
                                            <div className="absolute top-4 right-4 z-40 flex space-x-2">
                                                {/* View count */}
                                                <div className="backdrop-blur-lg bg-black/30 rounded-full px-3 py-1.5 border border-white/20 flex items-center">
                                                    <svg className="w-3.5 h-3.5 text-blue-300 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-white text-xs font-medium">{property.views || '0'}</span>
                                                </div>

                                                {/* Like button */}
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleLikeToggle(property.id);
                                                    }}
                                                    disabled={isLikeLoading}
                                                    className="backdrop-blur-lg bg-black/30 rounded-full px-3 py-1.5 border border-white/20 flex items-center"
                                                >
                                                    {isLikeLoading ? (
                                                        <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin mr-1"></div>
                                                    ) : (
                                                        <svg
                                                            className={`w-3.5 h-3.5 mr-1 ${likeState.isLiked ? 'text-red-400 fill-current' : 'text-white'}`}
                                                            fill={likeState.isLiked ? "currentColor" : "none"}
                                                            stroke="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                    <span className="text-white text-xs font-medium">
                                                        {likeState.count}
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Property info */}
                                            <div className="absolute top-12 left-4 right-4 z-30 flex justify-center">
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
                                                        <span>{property.rooms || 'N/A'} room{property.rooms !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    <span className="text-gray-400">|</span>
                                                    <div className="flex items-center text-white text-xs font-medium">
                                                        <svg className="w-3.5 h-3.5 mr-1 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                        </svg>
                                                        <span>{property.space || 'N/A'} m²</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location badge */}
                                            {hasCity && (
                                                <div className="absolute top-4 left-4 z-40">
                                                    <div className="backdrop-blur-lg bg-black/50 rounded-full px-3 py-1.5 border border-white/20 flex items-center">
                                                        <svg className="w-3.5 h-3.5 text-amber-400 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 01-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="text-white text-xs font-medium">{cityName}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Play button overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm border border-white/30">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Gradient overlay */}
                                            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none"></div>
                                        </div>

                                        {/* Property Info */}
                                        <div className="p-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                                    {property.title || `${propertyType} Property`}
                                                </h3>

                                                {/* AI-specific: Confidence Score */}
                                                {isAiSearch && property.confidence && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                        {Math.round((property.confidence || 0) * 100)}%
                                                    </span>
                                                )}
                                            </div>

                                            {/* Caption or Match Reason */}
                                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                                {isAiSearch ? (property.matchReason || "This property matches your search criteria.") : (property.caption || "No description available.")}
                                            </p>

                                            {/* Property Tags */}
                                            {hasPreferenceOrFeatureTags && (
                                                <div className="mb-2 flex flex-wrap gap-1">
                                                    {parsedPreferences.slice(0, 2).map((tag, idx) => (
                                                        <span key={`pref-${idx}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {parsedFeatures.slice(0, 2).map((tag, idx) => (
                                                        <span key={`feat-${idx}`} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {(parsedPreferences.length + parsedFeatures.length > 4) && (
                                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                            +{parsedPreferences.length + parsedFeatures.length - 4} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Location */}
                                            <div className="text-sm text-gray-600 mb-2">
                                                {property.address ||
                                                    (property.location && property.location.address) ||
                                                    (hasCity ? `${cityName}` : "Address not specified")}
                                            </div>

                                            {/* User Info */}
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-6 w-6 rounded-full overflow-hidden bg-gray-100 mr-2">
                                                    <img
                                                        src={property.avatarUrl || SVG_PLACEHOLDERS.USER}
                                                        alt={username}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = SVG_PLACEHOLDERS.USER;
                                                        }}
                                                    />
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {username || "Unknown user"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // No results display - only show when not loading and thinking is complete
                        (!isAiLoading && !isThinking) && (
                            <div className="text-center py-12">
                                <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                                    <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={isAiSearch ?
                                            "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" :
                                            "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"} />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No {isAiSearch ? "AI " : ""}matches found</h3>
                                <p className="text-gray-600 mb-4">
                                    {isAiSearch ?
                                        "Try using different words to describe what you're looking for." :
                                        "Try adjusting your search terms or filters to find what you're looking for."}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={handleClearSearch}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    >
                                        Browse All Properties
                                    </button>

                                    {!isAiSearch && (
                                        <button
                                            onClick={() => {
                                                setAiQueryInput(searchQuery || '');
                                                setTimeout(() => handleAiSearch(), 100);
                                            }}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                        >
                                            Try AI Search Instead
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    )}

                    {/* Load More Button */}
                    {!isAiSearch && !isSearching && searchResults.length > 0 && pagination.hasNextPage && (
                        <div className="text-center mt-8">
                            <button
                                onClick={handleLoadMore}
                                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Load More Properties
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchResults;