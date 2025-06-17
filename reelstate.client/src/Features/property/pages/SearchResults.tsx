import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchProperties, clearSearchResults } from '../../../store/slices/propertySlice';
import PropertyList from '../components/PropertyList';
import { SearchFilters } from '../types/Property';
import DynamicPropertyTags from '../components/VideoCard/DynamicPropertyTags';

const SearchResults: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const {
        searchResults,
        isSearching,
        error,
        searchQuery,
        currentFilters,
        pagination
    } = useAppSelector(state => state.property);

    useEffect(() => {
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

    if (isSearching) {
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

    if (error) {
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
                                Search Results
                            </h1>
                            {searchQuery && (
                                <p className="text-gray-600 mt-1">
                                    Results for "{searchQuery}"
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
                </div>

                {/* Results */}
                {searchResults.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-600 mb-4">
                            Try adjusting your search terms or filters to find what you are looking for.
                        </p>
                        <button
                            onClick={handleClearSearch}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                        >
                            Browse All Properties
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Grid Layout for Search Results */}
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
                                            {property.likes || 0} likes
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
                                            {property.location?.city}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex items-center">
                                            {property.avatarUrl ? (
                                                <img
                                                    src={property.avatarUrl}
                                                    alt={property.username}
                                                    className="w-6 h-6 rounded-full mr-2"
                                                />
                                            ) : (
                                                <div className="w-6 h-6 bg-gray-300 rounded-full mr-2"></div>
                                            )}
                                            <span className="text-sm text-gray-600">{property.username}</span>
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
                )}
            </div>
        </div>
    );
};

export default SearchResults;