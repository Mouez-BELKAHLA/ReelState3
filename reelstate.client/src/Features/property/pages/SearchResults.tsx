import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProperties, clearSearchResults } from '../../../store/slices/propertySlice';
import { searchWithAI, setQuery, toggleThinkingMode } from '../../../store/slices/aiSlice';
import { SearchFilters } from '../types/Property';
import DynamicPropertyTags from '../components/VideoCard/DynamicPropertyTags';

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
        pagination
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

    // Track whether this is an AI-powered search
    const [isAiSearch, setIsAiSearch] = useState(false);
    // Track AI query input
    const [aiQueryInput, setAiQueryInput] = useState('');
    // Reference for scrolling to results
    const resultsRef = useRef<HTMLDivElement>(null);

    // Inline thinking animation state
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const thinkingRef = useRef<NodeJS.Timeout | null>(null);

    // State to track if full thinking process should be displayed
    const [showAllSteps, setShowAllSteps] = useState(false);

    useEffect(() => {
        // Check if this is an AI search from URL
        const isAiParam = searchParams.get('ai') === 'true';
        const aiQuery = searchParams.get('aiQuery') || '';
        const useThinkingMode = searchParams.get('thinkingMode') === 'true';

        if (isAiParam) {
            setIsAiSearch(true);
            setAiQueryInput(aiQuery);

            // Run AI search - completely separate from filters
            if (aiQuery) {
                console.log("Running AI search with query:", aiQuery);
                dispatch(setQuery(aiQuery));

                // Use thinking mode if specified in URL
                dispatch(searchWithAI({
                    query: aiQuery,
                    useThinkingMode: useThinkingMode
                }));
            }
        } else {
            // Regular search with filters
            setIsAiSearch(false);
            setAiQueryInput('');
            setShowAllSteps(false); // Reset all steps view when changing search type

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

    // Reset show all steps when starting a new search
    useEffect(() => {
        if (isAiLoading || isThinking) {
            setShowAllSteps(false);
        }
    }, [isAiLoading, isThinking]);

    // Thinking animation in search bar area
    useEffect(() => {
        if (isAiLoading || isThinking) {
            const thinkingSteps = [
                `Analyzing your query: "${aiQueryInput}"...`,
                `Searching for properties that match your criteria...`,
                `Evaluating property features and preferences...`,
                `Looking for modern properties with garden and parking...`,
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
        } else if (!isThinking && !isAiLoading && thinkingProcess?.conclusion) {
            // Show conclusion when thinking is complete
            setThinkingStep(thinkingProcess.conclusion);
        }
    }, [isAiLoading, isThinking, aiQueryInput, thinkingProcess]);

    // Show thinking steps if available
    useEffect(() => {
        if (isThinking && thinkingProcess?.steps && thinkingProcess.steps.length > 0 && showThinkingMode) {
            const lastStep = thinkingProcess.steps[thinkingProcess.steps.length - 1];
            if (lastStep) {
                setThinkingStep(`${lastStep.title}: ${lastStep.description}`);
            }
        }
    }, [thinkingProcess, showThinkingMode, isThinking]);

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

        // Add thinking mode flag if enabled
        if (showThinkingMode) {
            params.set('thinkingMode', 'true');
        }

        // Update search params without navigation
        setSearchParams(params);

        // Reset all steps view when starting a new search
        setShowAllSteps(false);

        // Immediately set AI search state
        setIsAiSearch(true);

        // Dispatch AI search action directly
        dispatch(setQuery(aiQueryInput));
        dispatch(searchWithAI({
            query: aiQueryInput,
            useThinkingMode: showThinkingMode
        }));
    };

    const handleToggleThinking = () => {
        dispatch(toggleThinkingMode());
    };

    // Show all thinking steps
    const handleShowAllSteps = () => {
        setShowAllSteps(true);
        // Also enable thinking mode in the store if it's not already
        if (!showThinkingMode) {
            dispatch(toggleThinkingMode());
        }
    };

    // Retry with thinking mode if we got no results
    const retryWithThinking = () => {
        if (!isAiSearch || !aiQueryInput) return;

        // Update params without navigation
        const params = new URLSearchParams(searchParams);
        params.set('ai', 'true');
        params.set('aiQuery', aiQueryInput);
        params.set('thinkingMode', 'true');
        setSearchParams(params);

        // Dispatch actions directly
        dispatch(toggleThinkingMode());
        dispatch(searchWithAI({
            query: aiQueryInput,
            useThinkingMode: true
        }));
    };

    // Show full page loading state only when no thinking process is visible
    if ((isSearching && !isAiSearch) || (isAiLoading && isAiSearch && !showThinkingMode)) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className={`animate-spin rounded-full h-32 w-32 border-b-2 border-${isAiSearch ? 'purple' : 'blue'}-600`}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !isAiSearch) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <div className="text-red-600 text-xl mb-4">Search Error</div>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <button
                            onClick={handleClearSearch}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Back to Feed
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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

                                {/* Display current thinking step or conclusion */}
                                <div className="mt-2">
                                    {(isAiLoading || isThinking || (isAiSearch && thinkingProcess?.conclusion)) ? (
                                        <div className={`text-sm ${isThinking || isAiLoading ? 'text-purple-700 animate-pulse' : 'text-purple-900 font-medium'}`}>
                                            {!isThinking && !isAiLoading && thinkingProcess?.conclusion ? (
                                                <>AI's Conclusion: {thinkingProcess.conclusion}</>
                                            ) : thinkingStep}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500">
                                            Try: "I need a modern apartment with sea view" or "Find a family house with garden"
                                        </p>
                                    )}
                                </div>

                                {/* Show the "Show AI Process" button below the conclusion (only when we have completed the thinking) */}
                                {isAiSearch && !isThinking && !isAiLoading && thinkingProcess?.steps && thinkingProcess.steps.length > 0 && !showAllSteps && (
                                    <div className="mt-3">
                                        <button
                                            onClick={handleShowAllSteps}
                                            className="flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700"
                                        >
                                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            Show AI Process
                                        </button>
                                    </div>
                                )}

                                {/* Display all thinking steps when requested */}
                                {showAllSteps && thinkingProcess?.steps && thinkingProcess.steps.length > 0 && (
                                    <div className="mt-4 border-t border-purple-100 pt-3">
                                        <div className="text-sm font-medium text-purple-900 mb-2">
                                            AI Thinking Process:
                                        </div>
                                        <div className="space-y-3">
                                            {thinkingProcess.steps.map((step, idx) => (
                                                <div key={idx} className="mb-2">
                                                    <div className="text-sm font-medium text-purple-800">
                                                        Step {step.step}: {step.title}
                                                    </div>
                                                    <div className="text-sm text-purple-600 ml-4">
                                                        {step.description}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Progressive thinking indicators (dots) */}
                                {isAiSearch && showThinkingMode && isThinking && (
                                    <div className="mt-2 flex items-center space-x-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <span
                                                key={i}
                                                className="h-2 w-2 rounded-full bg-purple-600"
                                            />
                                        ))}
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
                                    {pagination.totalCount} properties found
                                </span>
                                <span>
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                            </div>

                            {/* Active Filters Display */}
                            {Object.keys(currentFilters).length > 0 && (
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
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
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
                            {/* Map over the appropriate array based on search type */}
                            {(isAiSearch ? recommendations : searchResults).map((property, index) => (
                                <div
                                    key={property.id || `property-${index}`}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                    onClick={() => property.id && navigate(`/property/${property.id}`)}
                                >
                                    {/* Property Image/Video */}
                                    <div className="relative h-48 bg-gray-200">
                                        {property.videoUrl ? (
                                            <video
                                                className="w-full h-full object-cover"
                                                poster={property.photoUrl || property.photos?.[0]?.photoUrl}
                                                muted
                                            >
                                                <source src={property.videoUrl} type="video/mp4" />
                                            </video>
                                        ) : property.photoUrl || property.photos?.[0]?.photoUrl ? (
                                            <img
                                                src={property.photoUrl || property.photos?.[0]?.photoUrl}
                                                alt={property.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                                <span className="text-gray-500">No Image</span>
                                            </div>
                                        )}

                                        {/* Property Type Badge - Now with explicit blue for regular search and purple for AI search */}
                                        <div className="absolute top-2 left-2">
                                            <span className={isAiSearch ? "bg-purple-600 text-white text-xs px-2 py-1 rounded-full" : "bg-blue-600 text-white text-xs px-2 py-1 rounded-full"}>
                                                {property.propertyType}
                                            </span>
                                        </div>

                                        {/* AI Badge or Likes Count */}
                                        <div className="absolute top-2 right-2">
                                            {isAiSearch ? (
                                                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                    AI Match
                                                </span>
                                            ) : (
                                                <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                                    {property.likesCount || 0} likes
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Property Info */}
                                    <div className="p-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                                {property.title}
                                            </h3>

                                            {/* AI-specific: Confidence Score */}
                                            {isAiSearch && property.confidence && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {Math.round(property.confidence * 100)}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Caption or Match Reason */}
                                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                            {isAiSearch ? (property.matchReason || "This property matches your search criteria.") : property.caption}
                                        </p>

                                        {/* Property Details */}
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                                            <span>{property.rooms} rooms</span>
                                            <span>{property.space}m²</span>
                                        </div>

                                        {/* Property Tags */}
                                        {isAiSearch ? (
                                            <div className="mb-2 flex flex-wrap gap-2">
                                                {property.propertyFeatures?.slice(0, 3).map((feature, idx) => (
                                                    <span key={`feature-${idx}`} className="text-xs text-purple-600">
                                                        #{feature}
                                                    </span>
                                                ))}
                                                {property.propertyPreferences?.slice(0, 3).map((pref, idx) => (
                                                    <span key={`pref-${idx}`} className="text-xs text-indigo-600">
                                                        #{pref}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <DynamicPropertyTags property={property} maxTagsToShow={3} />
                                        )}

                                        {/* Location */}
                                        <div className="text-sm text-gray-600 mb-2">
                                            {property.city || property.address}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex items-center">
                                            {property.user?.profilePictureUrl ? (
                                                <img
                                                    src={property.user.profilePictureUrl}
                                                    alt={`${property.user.firstName} ${property.user.lastName}`}
                                                    className="w-6 h-6 rounded-full mr-2"
                                                />
                                            ) : (
                                                <div className={`w-6 h-6 ${isAiSearch ? 'bg-purple-200 text-purple-600' : 'bg-gray-300'} rounded-full mr-2 flex items-center justify-center text-xs font-bold`}>
                                                    {property.user?.firstName?.[0] || '?'}
                                                </div>
                                            )}
                                            <span className="text-sm text-gray-600">
                                                {property.user ? `${property.user.firstName} ${property.user.lastName}` : "Unknown User"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                        className={isAiSearch ? "bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700" : "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"}
                                    >
                                        Browse All Properties
                                    </button>

                                    {isAiSearch && !searchParams.get('thinkingMode') && (
                                        <button
                                            onClick={retryWithThinking}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                                        >
                                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                                            </svg>
                                            Show AI Thinking
                                        </button>
                                    )}

                                    {!isAiSearch && (
                                        <button
                                            onClick={() => {
                                                setAiQueryInput(searchQuery);
                                                setTimeout(() => handleAiSearch(), 100);
                                            }}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
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