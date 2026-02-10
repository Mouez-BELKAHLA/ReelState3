import React from 'react';
import { PropertyCard } from './PropertyCard';

interface PropertyGridProps {
    properties: any[];
    isAiSearch: boolean;
    propertyLikes: Record<string, { isLiked: boolean, count: number }>;
    onPropertyClick: (property: any, index: number) => void;
}

export const PropertyGrid: React.FC<PropertyGridProps> = ({
    properties,
    isAiSearch,
    propertyLikes,
    onPropertyClick
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property, index) => {
                if (!property || !property.id) return null;

                // Get like state from Redux
                const likeState = propertyLikes[property.id] || {
                    isLiked: false,
                    count: property.likesCount || property.likes || 0
                };
                const isLikeLoading = false; // This would come from Redux in a real implementation

                return (
                    <PropertyCard
                        key={property.id || `property-${index}`}
                        property={property}
                        isAiSearch={isAiSearch}
                        likeState={likeState}
                        isLikeLoading={isLikeLoading}
                        onClick={() => onPropertyClick(property, index)}
                    />
                );
            })}
        </div>
    );
};