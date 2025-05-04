import React from 'react';

interface PropertyInfoTagsProps {
    rooms: number;
    propertyType: string;
    space: number;
}

const PropertyInfoTags: React.FC<PropertyInfoTagsProps> = ({
    rooms,
    propertyType,
    space
}) => {
    return (
        <div className="absolute bottom-6 left-4 flex flex-wrap gap-2 z-10">
            <span className="backdrop-blur-lg bg-transparent text-white text-sm font-medium py-1 px-3 rounded-full flex items-center border border-white/30">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 21V7L12 3L21 7V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 14V17" strokeWidth="2" strokeLinecap="round" />
                    <path d="M15 14V17" strokeWidth="2" strokeLinecap="round" />
                    <path d="M21 21H3" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {rooms} pièces
            </span>
            <span className="backdrop-blur-lg bg-transparent text-white text-sm font-medium py-1 px-3 rounded-full flex items-center border border-white/30">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M2 22H22" strokeWidth="2" strokeLinecap="round" />
                    <path d="M3 8V18C3 18.5523 3.44772 19 4 19H20C20.5523 19 21 18.5523 21 18V8" strokeWidth="2" strokeLinecap="round" />
                    <path d="M6 8V4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V8" strokeWidth="2" strokeLinecap="round" />
                </svg>
                {propertyType}
            </span>
            <span className="backdrop-blur-lg bg-transparent text-white text-sm font-medium py-1 px-3 rounded-full flex items-center border border-white/30">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4H20V20H4V4Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 9H20" strokeWidth="2" />
                </svg>
                {space} m²
            </span>
        </div>
    );
};

export default PropertyInfoTags;