import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    searchProperties,
    clearSearchResults,
    setActiveVideoIndex,
    toggleComments,
    setActiveProperty
} from '../../../store/slices/propertySlice';
import { searchWithAI, setQuery } from '../../../store/slices/aiSlice';
import { setShowNavbar } from '../../../store/slices/uiSlice';
import { PropertySearchControls } from '../components/search/PropertySearchControls';
import { PropertyGrid } from '../components/search/PropertyGrid';
import { VideoFeedMode } from '../components/search/VideoFeedMode';
import { NoResultsView } from '../components/search/NoResultsView';

const SearchResults: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Core state
    const [isAiSearch, setIsAiSearch] = useState(false);
    const [aiQueryInput, setAiQueryInput] = useState('');
    const [isVideoMode, setIsVideoMode] = useState(false);
    const [windowWidth, setWindowWidth] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [hasLargeLayout, setHasLargeLayout] = useState(false);

    // Get state from Redux
    const {
        searchResults,
        isSearching,
        searchQuery,
        pagination,
        propertyLikes,
        activeVideoIndex,
        activePropertyId,
        showComments
    } = useAppSelector(state => state.property);

    const { recommendations, isLoading: isAiLoading, isThinking } = useAppSelector(state => state.ai);
    const { showNavbar } = useAppSelector(state => state.ui);

    // Layout constants
    const LARGE_LAYOUT_BREAKPOINT = 1280;
    const MOBILE_BREAKPOINT = 768;
    const commentPanelWidth = windowWidth < 1400 ? 500 : 580;
    const slideOffset = 75;

    // Track current properties based on search type
    const currentProperties = isAiSearch ? recommendations : searchResults;

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

    // Show navbar by default when entering this component
    useEffect(() => {
        dispatch(setShowNavbar(true));
        return () => {
            dispatch(setShowNavbar(true));
        };
    }, [dispatch]);

    // Handle URL parameters for search/AI search
    useEffect(() => {
        // Check if this is an AI search from URL
        const isAiParam = searchParams.get('ai') === 'true';
        const aiQuery = searchParams.get('aiQuery') || '';
        const propertyId = searchParams.get('property');

        setIsVideoMode(!!propertyId);

        if (isAiParam) {
            setIsAiSearch(true);
            setAiQueryInput(aiQuery);

            // Run AI search if we have a query
            if (aiQuery) {
                dispatch(setQuery(aiQuery));
                dispatch(searchWithAI({
                    query: aiQuery,
                    useThinkingMode: true
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
            const filters = {};
            if (query) filters.q = query;
            if (propertyType) filters.propertyType = propertyType;
            if (city) filters.city = city;
            if (minRooms) filters.minRooms = parseInt(minRooms);
            if (maxRooms) filters.maxRooms = parseInt(maxRooms);
            if (minSpace) filters.minSpace = parseInt(minSpace);
            if (maxSpace) filters.maxSpace = parseInt(maxSpace);
            if (sortBy) filters.sortBy = sortBy;
            if (preferences) filters.preferences = preferences.split(',');
            if (features) filters.features = features.split(',');
            if (page) filters.page = parseInt(page);

            // Only search if we have a query or filters
            if (query || Object.keys(filters).length > 0) {
                dispatch(searchProperties({ query, filters }));
            }
        }
    }, [searchParams, dispatch]);

    // Handle property card click - switch to video mode
    const handlePropertyClick = (property, index) => {
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

        // Switch to video mode
        setIsVideoMode(true);
    };

    // Handle closing the video mode view
    const handleCloseVideoMode = () => {
        // Remove property parameter from URL
        const params = new URLSearchParams(searchParams);
        params.delete('property');
        setSearchParams(params);

        // Exit video mode
        setIsVideoMode(false);
        dispatch(setShowNavbar(true));
        dispatch(setActiveVideoIndex(-1));
    };

    // Handle AI search
    const handleAiSearch = () => {
        if (!aiQueryInput.trim()) return;

        const params = new URLSearchParams(searchParams);
        params.set('ai', 'true');
        params.set('aiQuery', aiQueryInput);
        params.delete('property');
        setSearchParams(params);

        setIsVideoMode(false);
        setIsAiSearch(true);

        dispatch(setQuery(aiQueryInput));
        dispatch(searchWithAI({
            query: aiQueryInput,
            useThinkingMode: true
        }));
    };

    // Handle clearing search
    const handleClearSearch = () => {
        dispatch(clearSearchResults());
        navigate('/feed');
    };

    // Handle comments toggle
    const handleToggleComments = (propertyId) => {
        dispatch(setActiveProperty(propertyId));
        dispatch(toggleComments(true));
    };

    // Calculate video width based on screen size
    const getVideoWidth = () => {
        if (windowWidth < 480) {
            return '100%';
        } else if (windowWidth < 768) {
            return '340px';
        } else {
            return '360px';
        }
    };

    // Handle video in view
    const handleVideoInView = (index) => {
        dispatch(setActiveVideoIndex(index));

        // Update URL to indicate current property
        if (currentProperties[index]) {
            const params = new URLSearchParams(searchParams);
            params.set('property', currentProperties[index].id);
            setSearchParams(params);
        }
    };

    // Render component based on state
    if (isVideoMode) {
        return (
            <VideoFeedMode
                properties={currentProperties}
                activeVideoIndex={activeVideoIndex}
                showComments={showComments}
                activePropertyId={activePropertyId}
                hasLargeLayout={hasLargeLayout}
                isMobile={isMobile}
                showNavbar={showNavbar}
                commentPanelWidth={commentPanelWidth}
                slideOffset={slideOffset}
                getVideoWidth={getVideoWidth}
                onCloseVideoMode={handleCloseVideoMode}
                onToggleComments={handleToggleComments}
                onVideoInView={handleVideoInView}
            />
        );
    }

    // Loading state
    if ((isSearching && !isAiSearch && !currentProperties.length) ||
        (isAiLoading && !currentProperties.length)) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <PropertySearchControls
                    isAiSearch={isAiSearch}
                    aiQueryInput={aiQueryInput}
                    setAiQueryInput={setAiQueryInput}
                    searchQuery={searchQuery}
                    pagination={pagination}
                    isAiLoading={isAiLoading}
                    isThinking={isThinking}
                    onAiSearch={handleAiSearch}
                    onClearSearch={handleClearSearch}
                />

                {currentProperties.length > 0 ? (
                    <PropertyGrid
                        properties={currentProperties}
                        isAiSearch={isAiSearch}
                        propertyLikes={propertyLikes}
                        onPropertyClick={handlePropertyClick}
                    />
                ) : (
                    (!isAiLoading && !isThinking) && (
                        <NoResultsView
                            isAiSearch={isAiSearch}
                            searchQuery={searchQuery}
                            aiQueryInput={aiQueryInput}
                            setAiQueryInput={setAiQueryInput}
                            onClearSearch={handleClearSearch}
                            onAiSearch={handleAiSearch}
                        />
                    )
                )}

                {/* Load More Button for pagination */}
                {!isAiSearch && !isSearching && searchResults.length > 0 && pagination.hasNextPage && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => {
                                const currentParams = new URLSearchParams(searchParams);
                                currentParams.set('page', (pagination.currentPage + 1).toString());
                                setSearchParams(currentParams);
                            }}
                            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Load More Properties
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;