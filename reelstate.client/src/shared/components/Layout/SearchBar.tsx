import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFilters } from '../../../Features/property/types/Property';
import { SearchService } from '../../../Features/property/services/SearchService';
import FilterModal from './FilterModal';

interface SearchBarProps {
    className?: string;
    isMobile?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
    className = '',
    isMobile = false
}) => {
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [filters, setFilters] = useState<SearchFilters>({});
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchValue.length > 2) {
                setIsLoadingSuggestions(true);
                try {
                    const searchSuggestions = await SearchService.getSearchSuggestions(searchValue);
                    setSuggestions(searchSuggestions);
                    setShowSuggestions(true);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                } finally {
                    setIsLoadingSuggestions(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchValue]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const navigateToSearch = (query: string, searchFilters: SearchFilters) => {
        const params = new URLSearchParams();

        if (query.trim()) {
            params.set('q', query.trim());
        }

        Object.entries(searchFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== '' && value !== null) {
                if (Array.isArray(value) && value.length > 0) {
                    params.set(key, value.join(','));
                } else if (!Array.isArray(value)) {
                    params.set(key, value.toString());
                }
            }
        });

        navigate(`/search?${params.toString()}`);
        setShowSuggestions(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        navigateToSearch(searchValue, filters);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchValue(suggestion);
        setShowSuggestions(false);
        navigateToSearch(suggestion, filters);
    };

    const handleFilterClick = () => {
        setShowFilterModal(true);
    };

    const handleFiltersApply = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        navigateToSearch(searchValue, newFilters);
    };

    // Modified to navigate directly to AI search page
    const handleAIClick = () => {
        navigate(`/search?ai=true&aiQuery=${encodeURIComponent(searchValue || '')}`);
    };

    const getActiveFiltersCount = () => {
        return Object.values(filters).filter(value => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== undefined && value !== '';
        }).length;
    };

    if (isMobile) {
        return (
            <>
                <FilterModal
                    isOpen={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    onApply={handleFiltersApply}
                    initialFilters={filters}
                />

                <div className={`px-4 pt-2 pb-3 ${className}`}>
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                name="search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search for properties, locations..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg"
                                >
                                    {isLoadingSuggestions ? (
                                        <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
                                    ) : (
                                        suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                            >
                                                {suggestion}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex space-x-2">
                            <button
                                type="submit"
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={handleFilterClick}
                                className="relative px-4 py-2 border border-gray-300 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Filters"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                {getActiveFiltersCount() > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {getActiveFiltersCount()}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleAIClick}
                                className="px-4 py-2 border border-purple-300 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                                title="AI Assistant"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </>
        );
    }

    return (
        <>
            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onApply={handleFiltersApply}
                initialFilters={filters}
            />

            <div className={`hidden md:flex flex-1 items-center justify-center px-2 lg:ml-6 lg:mr-6 ${className}`}>
                <div className="max-w-lg w-full relative">
                    <form onSubmit={handleSearch} className="relative flex items-center">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                name="search"
                                id="search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-full text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Search for properties, locations..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="absolute z-50 left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg"
                                >
                                    {isLoadingSuggestions ? (
                                        <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
                                    ) : (
                                        suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                onClick={() => handleSuggestionClick(suggestion)}
                                            >
                                                {suggestion}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleFilterClick}
                            className="relative px-3 py-2 border-t border-b border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Advanced Filters"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {getActiveFiltersCount() > 0 && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {getActiveFiltersCount()}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleAIClick}
                            className="px-3 py-2 border-t border-b border-r border-gray-300 bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
                            title="AI Property Assistant"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </button>

                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-r-full hover:bg-blue-700 transition-colors"
                        >
                            <span className="text-sm font-medium">Search</span>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default SearchBar;