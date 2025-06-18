import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { searchWithAI, setQuery, clearAISearch } from '../store/slices/aiSlice';
import { SearchFilters } from '../Features/property/types/Property';
import { AppDispatch } from '../store';

interface AiSearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
    initialFilters?: SearchFilters;
}

const AiSearchDialog: React.FC<AiSearchDialogProps> = ({
    isOpen,
    onClose,
    initialQuery = '',
    initialFilters = {}
}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const {
        isLoading,
        query,
        recommendations,
        error,
        parsedFilters
    } = useSelector((state: RootState) => state.ai);

    const [inputQuery, setInputQuery] = useState(initialQuery);

    // Update input when initialQuery changes
    useEffect(() => {
        if (initialQuery) {
            setInputQuery(initialQuery);
        }
    }, [initialQuery]);

    // Reset state when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setInputQuery('');
        }
    }, [isOpen]);

    // Debug logging
    useEffect(() => {
        console.log("Dialog rendering with isOpen:", isOpen);
        console.log("Current recommendations:", recommendations?.length);
        console.log("Current error state:", error);
    }, [isOpen, recommendations, error]);

    const handleSearch = () => {
        if (!inputQuery.trim()) return;

        console.log("Searching for:", inputQuery, "with filters:", initialFilters);
        dispatch(setQuery(inputQuery));
        dispatch(searchWithAI({
            query: inputQuery,
            filters: initialFilters
        }));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleRecommendationClick = (recommendation: any) => {
        // Navigate to property details or search with filters
        if (recommendation.id) {
            navigate(`/property/${recommendation.id}`);
        } else if (parsedFilters) {
            // Create URL with parsed filters
            const params = new URLSearchParams();

            Object.entries(parsedFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        params.set(key, value.join(','));
                    } else {
                        params.set(key, String(value));
                    }
                }
            });

            // Add the original query
            if (query) {
                params.set('q', query);
            }

            navigate(`/search?${params.toString()}`);
        }

        onClose();
    };

    // Force render for debugging
    if (!isOpen) {
        console.log("Dialog not rendering - isOpen is false");
        return null;
    }

    console.log("Dialog IS rendering - isOpen is true");

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-75" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-t-lg p-4 flex items-center justify-between">
                        <h3 className="text-lg font-medium text-white flex items-center">
                            <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            ReelState AI Assistant
                        </h3>
                        <button type="button" onClick={onClose} className="text-white hover:text-gray-200">
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                        <p className="text-sm text-gray-600 mb-4">
                            Ask about properties, locations, or features you're looking for.
                        </p>

                        <div className="relative">
                            <input
                                type="text"
                                className="block w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                                placeholder="What kind of property are you looking for?"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                onKeyPress={handleKeyPress}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-purple-600 hover:text-purple-800"
                                onClick={handleSearch}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        {/* Examples */}
                        {!isLoading && !error && recommendations.length === 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-gray-500 mb-2">Try asking:</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setInputQuery("Find me a modern apartment with a sea view")}
                                        className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
                                    >
                                        Find me a modern apartment with a sea view
                                    </button>
                                    <button
                                        onClick={() => setInputQuery("I need a house with at least 3 bedrooms and a garden")}
                                        className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md"
                                    >
                                        I need a house with at least 3 bedrooms and a garden
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex">
                                    <svg className="h-5 w-5 text-red-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-red-800">
                                            {error}
                                        </p>
                                        <p className="mt-1 text-xs text-red-700">
                                            Please try again with a different query.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        {recommendations.length > 0 && (
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Recommendations</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                    {recommendations.map((recommendation, index) => (
                                        <div
                                            key={index}
                                            className="p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors shadow-sm"
                                            onClick={() => handleRecommendationClick(recommendation)}
                                        >
                                            <div className="flex items-start">
                                                {recommendation.photoUrl ? (
                                                    <img
                                                        src={recommendation.photoUrl}
                                                        alt={recommendation.title}
                                                        className="h-14 w-14 object-cover rounded-md mr-3 bg-gray-100"
                                                    />
                                                ) : (
                                                    <div className="h-14 w-14 rounded-md bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center mr-3">
                                                        <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <h5 className="text-sm font-medium text-gray-900">{recommendation.title}</h5>
                                                    <p className="text-xs text-gray-500 mt-1">{recommendation.matchReason}</p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {recommendation.propertyType && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                {recommendation.propertyType}
                                                            </span>
                                                        )}
                                                        {recommendation.rooms && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                {recommendation.rooms} rooms
                                                            </span>
                                                        )}
                                                        {recommendation.city && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                                {recommendation.city}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-4 rounded-b-lg flex justify-between">
                        <p className="text-xs text-gray-500">
                            Powered by Gemini AI
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiSearchDialog;