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

    // This function now just updates the filters state without navigation
    const handleFiltersApply = (newFilters: SearchFilters) => {
        setFilters(newFilters);
        setShowFilterModal(false); // Close the modal after applying filters
        // No navigation here - wait for search button click
    };

    // Navigate directly to AI search page
    const handleAIClick = () => {
        navigate(`/search?ai=true&aiQuery=${encodeURIComponent(searchValue || '')}`);
    };

    const getActiveFiltersCount = () => {
        return Object.values(filters).filter(value => {
            if (Array.isArray(value)) return value.length > 0;
            return value !== undefined && value !== '';
        }).length;
    };

    // Custom CSS for animations and styling - matching navbar style
    const customStyles = `
        /* Search input animations */
        .search-input {
            transition: all 0.3s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .search-input:focus {
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }
        
        /* Custom button animations */
        .btn-effect {
            position: relative;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            overflow: hidden;
        }
        
        .btn-effect:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 0%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.1);
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: -1;
        }
        
        .btn-effect:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(59, 130, 246, 0.2);
        }
        
        .btn-effect:hover:before {
            width: 100%;
        }
        
        .btn-effect:active {
            transform: translateY(1px);
        }
        
        /* Filter button animation */
        .filter-btn {
            transition: all 0.2s ease;
        }
        
        .filter-btn:hover {
            background-color: #f3f4f6;
            border-color: #d1d5db;
        }
        
        .filter-btn:active {
            background-color: #e5e7eb;
        }
        
        /* AI button animation */
        .ai-btn {
            transition: all 0.2s ease;
            border-color: rgba(147, 51, 234, 0.3);
        }
        
        .ai-btn:hover {
            background-color: rgba(147, 51, 234, 0.1);
            border-color: rgba(147, 51, 234, 0.5);
        }
        
        /* Suggestion dropdown animation */
        .dropdown-slide {
            animation: dropdownSlide 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
            transform-origin: top center;
        }
        
        @keyframes dropdownSlide {
            from {
                opacity: 0;
                transform: translateY(-10px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .suggestion-item {
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        
        .suggestion-item:hover {
            background-color: #f9fafb;
            border-left-color: #3b82f6;
            padding-left: 1rem;
        }
        
        /* Badge animation */
        @keyframes pulseBadge {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .badge-pulse {
            animation: pulseBadge 2s infinite cubic-bezier(0.66, 0, 0.34, 1);
        }
        
        .tunisia-shadow {
            box-shadow: 0 4px 14px -2px rgba(59, 130, 246, 0.2);
        }
    `;

    if (isMobile) {
        return (
            <>
                <style jsx>{customStyles}</style>
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
                                className="search-input block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search for properties, locations..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="dropdown-slide absolute z-50 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg tunisia-shadow"
                                >
                                    {isLoadingSuggestions ? (
                                        <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
                                    ) : (
                                        suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="suggestion-item px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
                                className="btn-effect flex-1 py-2 px-4 rounded-lg text-sm font-medium text-white"
                                style={{
                                    background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)'
                                }}
                            >
                                Search
                            </button>
                            <button
                                type="button"
                                onClick={handleFilterClick}
                                className="filter-btn relative px-4 py-2 border border-gray-300 bg-gray-50 text-gray-600 rounded-lg"
                                title="Filters"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                {getActiveFiltersCount() > 0 && (
                                    <span className="badge-pulse absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                        {getActiveFiltersCount()}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleAIClick}
                                className="ai-btn px-4 py-2 border border-purple-300 bg-purple-50 text-purple-600 rounded-lg"
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
            <style jsx>{customStyles}</style>
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
                                className="search-input block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-l-full text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Search for properties, locations..."
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                            />

                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={suggestionsRef}
                                    className="dropdown-slide absolute z-50 left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg tunisia-shadow"
                                >
                                    {isLoadingSuggestions ? (
                                        <div className="px-3 py-2 text-gray-500 text-sm">Loading...</div>
                                    ) : (
                                        suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className="suggestion-item px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
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
                            className="filter-btn relative px-3 py-2 border-t border-b border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                            title="Advanced Filters"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {getActiveFiltersCount() > 0 && (
                                <span className="badge-pulse absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {getActiveFiltersCount()}
                                </span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleAIClick}
                            className="ai-btn px-3 py-2 border-t border-b border-r border-gray-300 bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
                            title="AI Property Assistant"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </button>

                        <button
                            type="submit"
                            className="btn-effect px-4 py-2 text-white rounded-r-full"
                            style={{
                                background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)'
                            }}
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