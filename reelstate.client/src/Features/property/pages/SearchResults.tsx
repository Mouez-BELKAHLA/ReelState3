import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProperties, clearSearchResults } from '../../../store/slices/propertySlice';
import { searchWithAI, setQuery, toggleThinkingMode } from '../../../store/slices/aiSlice';
import { SearchFilters } from '../types/Property';
import DynamicPropertyTags from '../components/VideoCard/DynamicPropertyTags';
import AIThinkingProcess from "../../ai/components/AIThinkingProcess";

const SearchResults: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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

    const handleLoadMore = () => {
        if (pagination.hasNextPage) {
            const currentParams = new URLSearchParams(searchParams);
            currentParams.set('page', (pagination.currentPage + 1).toString());
            navigate(`/search?${currentParams.toString()}`, { replace: true });
        }
    };

    const handleClearSearch = () => {
        dispatch(clearSearchResults());
        navigate('/feed');
    };

    const handleAiSearch = () => {
        if (!aiQueryInput.trim()) return;

        // AI search is completely separate from regular search
        // We use only the aiQuery parameter and ai=true flag
        const params = new URLSearchParams();
        params.set('ai', 'true');
        params.set('aiQuery', aiQueryInput);

        // Add thinking mode flag if enabled
        if (showThinkingMode) {
            params.set('thinkingMode', 'true');
        }

        navigate(`/search?${params.toString()}`);
    };

    const handleToggleThinking = () => {
        dispatch(toggleThinkingMode());
    };

    // Retry with thinking mode if we got no results
    const retryWithThinking = () => {
        if (!isAiSearch || !searchParams.get('aiQuery')) return;

        const params = new URLSearchParams();
        params.set('ai', 'true');
        params.set('aiQuery', searchParams.get('aiQuery') || '');
        params.set('thinkingMode', 'true');

        navigate(`/search?${params.toString()}`);
    };

    if ((isSearching && !isAiSearch) || (isAiLoading && isAiSearch)) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
                            {isAiSearch && searchParams.get('aiQuery') && (
                                <p className="text-gray-600 mt-1">
                                    AI results for "{searchParams.get('aiQuery')}"
                                    {searchParams.get('thinkingMode') === 'true' &&
                                        " (with thinking process)"}
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
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-r-md hover:bg-purple-700"
                                        onClick={handleAiSearch}
                                    >
                                        Search
                                    </button>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <p className="text-xs text-gray-500">
                                        Try: "I need a modern apartment with sea view" or "Find a family house with garden"
                                    </p>
                                    <div className="flex items-center">
                                        <input
                                            id="thinking-mode"
                                            type="checkbox"
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            checked={showThinkingMode}
                                            onChange={handleToggleThinking}
                                        />
                                        <label htmlFor="thinking-mode" className="ml-2 block text-xs text-indigo-700">
                                            Show AI Thinking Process
                                        </label>
                                    </div>
                                </div>
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

                    {/* Show AI Thinking Process if enabled */}
                    {isAiSearch && showThinkingMode && (
                        <AIThinkingProcess
                            thinkingProcess={thinkingProcess}
                            isThinking={isThinking}
                        />
                    )}

                    {/* AI Search Explanation - only for AI searches with results */}
                    {isAiSearch && recommendations.length > 0 && (
                        <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-medium text-purple-900 mb-2 flex items-center">
                                <svg className="h-5 w-5 text-purple-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                How AI Found These Properties
                            </h3>

                            {/* AI Reasoning */}
                            <div className="mb-3 text-sm text-gray-600">
                                {recommendations[0]?.matchReason || "Based on your natural language description, I analyzed property features, locations, amenities and other details to find the best matches."}
                            </div>

                            <div className="text-xs text-gray-500 italic">
                                Unlike traditional search that uses explicit filters, AI search understands the meaning behind your query and finds properties that match your description directly.
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

                {/* Display appropriate results based on search type */}
                {isAiSearch ? (
                    // AI Search Results 
                    recommendations.length === 0 ? (
                        // No AI results found
                        <div className="text-center py-12">
                            <div className="mx-auto h-24 w-24 text-purple-300 mb-4">
                                <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-purple-900 mb-2">No AI matches found</h3>
                            <p className="text-gray-600 mb-4">
                                Try using different words to describe what you're looking for.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleClearSearch}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                                >
                                    Browse All Properties
                                </button>

                                {!searchParams.get('thinkingMode') && (
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
                            </div>
                        </div>
                    ) : (
                        // AI results found - display in a special layout
                        <div className="space-y-8">
                            {recommendations.map((recommendation, index) => (
                                <div
                                    key={index}
                                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-600"
                                    onClick={() => recommendation.id && navigate(`/property/${recommendation.id}`)}
                                >
                                    <div className="md:flex">
                                        {/* Property Image */}
                                        <div className="md:flex-shrink-0 md:w-64 h-48 md:h-auto relative">
                                            {recommendation.photoUrl ? (
                                                <img
                                                    src={recommendation.photoUrl}
                                                    alt={recommendation.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                                    <svg className="h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                    </svg>
                                                </div>
                                            )}

                                            {/* AI Match Badge */}
                                            <div className="absolute top-2 right-2">
                                                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                                                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                    </svg>
                                                    AI Match
                                                </span>
                                            </div>
                                        </div>

                                        {/* Property Info */}
                                        <div className="p-6">
                                            <div className="flex items-center">
                                                <div className="flex-1">
                                                    <h2 className="text-xl font-semibold text-gray-900">
                                                        {recommendation.title}
                                                    </h2>
                                                    {recommendation.propertyType && (
                                                        <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md">
                                                            {recommendation.propertyType}
                                                        </span>
                                                    )}
                                                </div>
                                                {recommendation.confidence && (
                                                    <div className="ml-4 flex-shrink-0">
                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                                            {Math.round(recommendation.confidence * 100)}% match
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-4">
                                                <p className="text-sm text-gray-600">
                                                    {recommendation.matchReason || "This property matches your search criteria."}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex items-center text-sm text-gray-600">
                                                {recommendation.rooms && (
                                                    <div className="mr-4 flex items-center">
                                                        <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        {recommendation.rooms} rooms
                                                    </div>
                                                )}

                                                {recommendation.space && (
                                                    <div className="mr-4 flex items-center">
                                                        <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                                                        </svg>
                                                        {recommendation.space}m²
                                                    </div>
                                                )}

                                                {recommendation.city && (
                                                    <div className="flex items-center">
                                                        <svg className="h-4 w-4 text-gray-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        {recommendation.city}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Property Features/Preferences */}
                                            {(recommendation.propertyFeatures?.length > 0 || recommendation.propertyPreferences?.length > 0) && (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {recommendation.propertyFeatures?.slice(0, 3).map((feature, idx) => (
                                                        <span key={`feature-${idx}`} className="text-xs text-blue-600">
                                                            #{feature}
                                                        </span>
                                                    ))}
                                                    {recommendation.propertyPreferences?.slice(0, 3).map((pref, idx) => (
                                                        <span key={`pref-${idx}`} className="text-xs text-purple-600">
                                                            #{pref}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    // Regular Search Results
                    searchResults.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                            <p className="text-gray-600 mb-4">
                                Try adjusting your search terms or filters to find what you're looking for.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={handleClearSearch}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                >
                                    Browse All Properties
                                </button>
                                <button
                                    onClick={() => {
                                        setAiQueryInput(searchQuery);
                                        setTimeout(() => handleAiSearch(), 100);
                                    }}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                                >
                                    Try AI Search Instead
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Regular search results grid
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {searchResults.map((property) => (
                                    <div
                                        key={property.id}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() => navigate(`/property/${property.id}`)}
                                    >
                                        {/* Property Image/Video */}
                                        <div className="relative h-48 bg-gray-200">
                                            {property.videoUrl ? (
                                                <video
                                                    className="w-full h-full object-cover"
                                                    poster={property.photos?.[0]?.photoUrl}
                                                    muted
                                                >
                                                    <source src={property.videoUrl} type="video/mp4" />
                                                </video>
                                            ) : property.photos?.[0] ? (
                                                <img
                                                    src={property.photos[0].photoUrl}
                                                    alt={property.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-gray-500">No Image</span>
                                                </div>
                                            )}

                                            {/* Property Type Badge */}
                                            <div className="absolute top-2 left-2">
                                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                                    {property.propertyType}
                                                </span>
                                            </div>

                                            {/* Likes Count */}
                                            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                                {property.likesCount || 0} likes
                                            </div>
                                        </div>

                                        {/* Property Info */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                                {property.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                                {property.caption}
                                            </p>

                                            {/* Property Details */}
                                            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                                                <span>{property.rooms} rooms</span>
                                                <span>{property.space}m²</span>
                                            </div>

                                            {/* Property Tags */}
                                            <DynamicPropertyTags property={property} maxTagsToShow={3} />

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
                                                    <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                                                )}
                                                <span className="text-sm text-gray-600">
                                                    {property.user ? `${property.user.firstName} ${property.user.lastName}` : "Unknown User"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Load More Button */}
                            {pagination.hasNextPage && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={handleLoadMore}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        Load More Properties
                                    </button>
                                </div>
                            )}
                        </>
                    )
                )}
            </div>
        </div>
    );
};

export default SearchResults;