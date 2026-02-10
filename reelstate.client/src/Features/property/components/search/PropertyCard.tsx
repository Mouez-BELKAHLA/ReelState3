import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { toggleLike } from '../../../../store/slices/propertySlice';

// SVG placeholders defined once at the component level
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

interface PropertyCardProps {
    property: any;
    isAiSearch: boolean;
    likeState: {
        isLiked: boolean;
        count: number;
    };
    isLikeLoading: boolean;
    onClick: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
    property,
    isAiSearch,
    likeState,
    isLikeLoading,
    onClick
}) => {
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector(state => state.auth);

    // Use helper functions to get property data
    const propertyType = property.propertyType || 'Property';

    // Parse preferences and features for tags
    const parsedPreferences = parsePropertyTags(property.propertyPreferences);
    const parsedFeatures = parsePropertyTags(property.propertyFeatures);

    // Check if we have any preference or feature tags to show
    const hasPreferenceOrFeatureTags = parsedPreferences.length > 0 || parsedFeatures.length > 0;

    // Improved city display logic - show city if available
    const hasCity = Boolean(property.city || (property.location && property.location.city));
    const cityName = property.city || (property.location && property.location.city) || '';

    // Get username
    const username = property.username || '';

    // Handle like toggle
    const handleLikeToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        dispatch(toggleLike(property.id));
    };

    return (
        <div
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={onClick}
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
                        onClick={handleLikeToggle}
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
};