import React, { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../../../../store/hooks';

interface PropertySearchControlsProps {
    isAiSearch: boolean;
    aiQueryInput: string;
    setAiQueryInput: (value: string) => void;
    searchQuery: string;
    pagination: any;
    isAiLoading: boolean;
    isThinking: boolean;
    onAiSearch: () => void;
    onClearSearch: () => void;
}

export const PropertySearchControls: React.FC<PropertySearchControlsProps> = ({
    isAiSearch,
    aiQueryInput,
    setAiQueryInput,
    searchQuery,
    pagination,
    isAiLoading,
    isThinking,
    onAiSearch,
    onClearSearch
}) => {
    // State for AI thinking animation
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const thinkingRef = useRef<NodeJS.Timeout | null>(null);

    // State for showing full thinking process
    const [showFullThinking, setShowFullThinking] = useState(false);

    // Get thinking process from Redux
    const { thinkingProcess } = useAppSelector(state => state.ai);
    const { currentFilters } = useAppSelector(state => state.property);

    // Toggle showing full thinking process
    const toggleFullThinking = () => {
        setShowFullThinking(!showFullThinking);
    };

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

    return (
        <div className="mb-8">
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
                    onClick={onClearSearch}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                    Back to Feed
                </button>
            </div>

            {/* AI Search Input */}
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
                                onKeyPress={(e) => e.key === 'Enter' && onAiSearch()}
                                disabled={isAiLoading || isThinking}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center px-3 py-1.5 bg-purple-600 text-white text-sm rounded-r-md hover:bg-purple-700 disabled:opacity-50"
                                onClick={onAiSearch}
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

                        {/* Thinking process indicator dots */}
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

                        {/* Show "View full thinking process" button */}
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
    );
};