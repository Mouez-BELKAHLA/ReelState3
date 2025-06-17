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
            {allTags.slice(0, maxTagsToShow).map((tag, index) => (
                <div
                    key={`tag-${index}`}
                    className="text-sm text-gray-200 font-medium"
                >
                    #{tag}
                </div>
            ))}

            {/* Show "+more" indicator if there are more tags */}
            {allTags.length > maxTagsToShow && (
                <div className="text-sm text-gray-400 font-medium">
                    +{allTags.length - maxTagsToShow} more
                </div>
            )}
        </div>
    );
};

export default DynamicPropertyTags;