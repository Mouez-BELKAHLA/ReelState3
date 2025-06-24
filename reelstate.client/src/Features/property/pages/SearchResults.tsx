import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProperties, clearSearchResults, checkLikeStatus, toggleLike, updatePropertyLike } from '../../../store/slices/propertySlice';
import { searchWithAI, setQuery } from '../../../store/slices/aiSlice';
import { SearchFilters } from '../types/Property';
import { PropertyList } from '..';
import { setShowNavbar } from '../../../store/slices/uiSlice';
import { CommentPanel } from "../../../shared";
import axios from 'axios';
import { API_URL } from "../../../shared";

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

    // Reference for scrolling to results
    const resultsRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State to toggle full thinking process visibility
    const [showFullThinking, setShowFullThinking] = useState(false);

    // Session-based view tracking - only track views when videos actually play
    const [sessionViewedVideos, setSessionViewedVideos] = useState<Set<string>>(new Set());
    const [viewLoading, setViewLoading] = useState<{ [key: string]: boolean }>({});

    // Inline thinking animation state
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const thinkingRef = useRef<NodeJS.Timeout | null>(null);

    // Layout state - similar to Feed.tsx
    const [hasLargeLayout, setHasLargeLayout] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    const [previousIndex, setPreviousIndex] = useState(-1);
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
    }, [dispatch, previousIndex, isMobile]);

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

            /* Search results area styling */
            .search-controls {
                background-color: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                padding: 16px;
                margin-bottom: 16px;
                z-index: 100;
                position: relative;
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

    // Handle like toggle using Redux
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

    // Handle comments toggle - calls the Redux action
    const handleToggleComments = (propertyId: string) => {
        dispatch(setActiveProperty(propertyId));
        dispatch(toggleComments(true));
    };

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
    }, [searchParams, dispatch]);

    // Scroll to results when they're loaded
    useEffect(() => {
        if (!isAiLoading && recommendations.length > 0 && isAiSearch) {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isAiLoading, recommendations, isAiSearch]);

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

        // Update search params without navigation
        setSearchParams(params);

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
    }, [previousIndex, isMobile, dispatch]);

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

    // Render loading state
    if ((isSearching && !isAiSearch) || (isAiLoading && !currentProperties.length)) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && !isAiSearch) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error Loading Properties</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => dispatch(searchProperties({}))}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // When we have results, show them in the TikTok-style PropertyList
    return (
        <div className="bg-black min-h-screen relative">
            {/* Search Controls Overlay - Fixed at the top */}
            <div className="fixed top-14 left-0 right-0 z-50 px-4 py-2">
                <div className="search-controls max-w-7xl mx-auto">
                    {/* Search Header */}
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

                    {/* AI Search Input */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100">
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
                            </div>
                        </div>
                    </div>

                    {/* Regular search filters display (only for non-AI searches) */}
                    {!isAiSearch && currentFilters && Object.keys(currentFilters).length > 0 && (
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
                </div>
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

            {/* TikTok-style Video Feed */}
            {currentProperties.length > 0 ? (
                <>
                    <div className="pt-40" ref={resultsRef}> {/* Add padding-top to account for the search controls */}
                        <div
                            className="overflow-hidden snap-y snap-mandatory"
                            style={{
                                height: getContainerHeight(),
                                transition: 'height 0.3s ease'
                            }}
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
                </>
            ) : (
                // No results display
                (!isAiLoading && !isThinking) && (
                    <div className="pt-40 text-center py-12 text-white">
                        <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                            <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={isAiSearch ?
                                    "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" :
                                    "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"} />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No {isAiSearch ? "AI " : ""}matches found</h3>
                        <p className="text-gray-300 mb-4">
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
        </div>
    );
};

export default SearchResults;