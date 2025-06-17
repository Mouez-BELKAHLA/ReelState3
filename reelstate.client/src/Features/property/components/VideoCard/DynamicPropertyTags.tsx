import React from 'react';

interface PropertyData {
    id?: string;
    title?: string;
    caption?: string;
    rooms?: number;
    propertyType?: string;
    space?: number;
    videoUrl?: string;
    photos?: { id: string; photoUrl: string }[];
    propertyPreferences?: string | string[];
    propertyFeatures?: string | string[];
}

interface DynamicPropertyTagsProps {
    property: PropertyData;
    maxTagsToShow?: number;
}

const DynamicPropertyTags: React.FC<DynamicPropertyTagsProps> = ({
    property,
    maxTagsToShow = 5
}) => {
    // Enhanced tag styling definitions with comprehensive icons
    const getTagStyle = (tagName: string) => {
        const lowerTag = tagName.toLowerCase();

        // Style categories
        if (['modern', 'traditional', 'luxury', 'budget-friendly', 'spacious', 'compact', 'stylish', 'cozy', 'elegant'].includes(lowerTag)) {
            return {
                bgColor: 'bg-indigo-500/20',
                borderColor: 'border-indigo-300/40',
                icon: (
                    <svg className="w-3 h-3 mr-1 text-indigo-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ),
            };
        } else if (['near amenities', 'quiet location', 'urban', 'rural', 'family-friendly', 'investment', 'central location', 'residential area'].includes(lowerTag)) {
            return {
                bgColor: 'bg-amber-500/20',
                borderColor: 'border-amber-300/40',
                icon: (
                    <svg className="w-3 h-3 mr-1 text-amber-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.757.433l.018.008.006.003zM10 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                ),
            };
        } else if (['parking', 'garden', 'pool', 'balcony', 'elevator', 'gym', 'storage room', 'security system', 'terrace', 'garage'].includes(lowerTag)) {
            return {
                bgColor: 'bg-emerald-500/20',
                borderColor: 'border-emerald-300/40',
                icon: (
                    <svg className="w-3 h-3 mr-1 text-emerald-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                ),
            };
        } else if (['air conditioning', 'heating', 'furnished', 'move-in ready', 'renovation potential', 'fireplace', 'hardwood floors'].includes(lowerTag)) {
            return {
                bgColor: 'bg-blue-500/20',
                borderColor: 'border-blue-300/40',
                icon: (
                    <svg className="w-3 h-3 mr-1 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M15.98 1.804a1 1 0 00-1.96 0l-.24 1.192a1 1 0 01-.784.785l-1.192.238a1 1 0 000 1.962l1.192.238a1 1 0 01.785.785l.238 1.192a1 1 0 001.962 0l.238-1.192a1 1 0 01.785-.785l1.192-.238a1 1 0 000-1.962l-1.192-.238a1 1 0 01-.785-.785l-.238-1.192zM6.949 5.684a1 1 0 00-1.898 0l-.683 2.051a1 1 0 01-.633.633l-2.051.683a1 1 0 000 1.898l2.051.684a1 1 0 01.633.632l.683 2.051a1 1 0 001.898 0l.683-2.051a1 1 0 01.633-.633l2.051-.683a1 1 0 000-1.898l-2.051-.683a1 1 0 01-.633-.633L6.95 5.684zM13.949 13.684a1 1 0 00-1.898 0l-.184.551a1 1 0 01-.632.633l-.551.183a1 1 0 000 1.898l.551.183a1 1 0 01.633.633l.183.551a1 1 0 001.898 0l.184-.551a1 1 0 01.632-.633l.551-.183a1 1 0 000-1.898l-.551-.184a1 1 0 01-.633-.632l-.183-.551z" />
                    </svg>
                ),
            };
        } else if (['pet friendly', 'laundry', 'dishwasher', 'washing machine'].includes(lowerTag)) {
            return {
                bgColor: 'bg-purple-500/20',
                borderColor: 'border-purple-300/40',
                icon: (
                    <svg className="w-3 h-3 mr-1 text-purple-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                    </svg>
                ),
            };
        } else if (['sea view', 'mountain view', 'city view', 'garden view', 'panoramic view'].includes(lowerTag)) {
            return {
                bgColor: 'bg-cyan-500/20',
                borderColor: 'border-cyan-300/40',
                icon: (
                    <svg className="w-3 h-3 mr-1 text-cyan-300" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                ),
            };
        } else {
            // Default style for any other tags
            return {
                bgColor: 'bg-teal-500/20',
                borderColor: 'border-teal-300/40',
                icon: (
                    <svg className="w-3 h-3 mr-1 text-teal-300" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                ),
            };
        }
    };

    // Enhanced parsing function
    const parsePropertyTags = (value: string | string[] | undefined): string[] => {
        if (!value) return [];
        if (Array.isArray(value)) return value.filter(Boolean);

        if (typeof value === 'string') {
            try {
                // Try to parse as JSON first
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
            } catch {
                // If JSON parsing fails, try comma separation
                return value.split(',').map(item => item.trim()).filter(Boolean);
            }
        }

        return [];
    };

    // Get all tags from preferences and features ONLY
    const preferenceTags = parsePropertyTags(property.propertyPreferences);
    const featureTags = parsePropertyTags(property.propertyFeatures);
    const allTags = [...preferenceTags, ...featureTags];

    // If no preference or feature tags, don't render anything
    if (allTags.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-hide max-w-full">
            {allTags.slice(0, maxTagsToShow).map((tag, index) => {
                const style = getTagStyle(tag);
                return (
                    <div
                        key={`tag-${index}`}
                        className={`backdrop-blur-lg ${style.bgColor} rounded-full px-2.5 py-1 border ${style.borderColor} flex items-center flex-shrink-0`}
                    >
                        {style.icon}
                        <span className="text-white text-xs font-medium">{tag}</span>
                    </div>
                );
            })}

            {/* Show "+more" indicator if there are more tags */}
            {allTags.length > maxTagsToShow && (
                <div className="backdrop-blur-lg bg-gray-500/20 rounded-full px-2.5 py-1 border border-gray-300/40 flex items-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">+{allTags.length - maxTagsToShow} more</span>
                </div>
            )}
        </div>
    );
};

export default DynamicPropertyTags;