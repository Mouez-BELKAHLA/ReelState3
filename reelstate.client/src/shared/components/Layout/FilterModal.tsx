import React, { useState, useEffect } from 'react';
import { SearchFilters, propertyTypes, propertyPreferences, propertyFeatures } from '../../../Features/property/types/Property';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: SearchFilters) => void;
    initialFilters?: SearchFilters;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onApply, initialFilters = {} }) => {
    const [filters, setFilters] = useState<SearchFilters>(initialFilters);

    useEffect(() => {
        setFilters(initialFilters);
    }, [initialFilters]);

    const handleInputChange = (field: keyof SearchFilters, value: string | number | undefined) => {
        setFilters(prev => ({
            ...prev,
            [field]: value === '' ? undefined : value
        }));
    };

    const handleArrayChange = (field: 'preferences' | 'features', value: string, checked: boolean) => {
        setFilters(prev => {
            const currentArray = prev[field] || [];
            if (checked) {
                return {
                    ...prev,
                    [field]: [...currentArray, value]
                };
            } else {
                return {
                    ...prev,
                    [field]: currentArray.filter(item => item !== value)
                };
            }
        });
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClear = () => {
        setFilters({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Filter Properties</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Property Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Property Type
                            </label>
                            <select
                                value={filters.propertyType || ''}
                                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {propertyTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Rooms */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Min Rooms
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.minRooms || ''}
                                    onChange={(e) => handleInputChange('minRooms', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Any"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Rooms
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.maxRooms || ''}
                                    onChange={(e) => handleInputChange('maxRooms', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Any"
                                />
                            </div>
                        </div>

                        {/* Space */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Min Space (m²)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.minSpace || ''}
                                    onChange={(e) => handleInputChange('minSpace', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Any"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Max Space (m²)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={filters.maxSpace || ''}
                                    onChange={(e) => handleInputChange('maxSpace', e.target.value ? parseInt(e.target.value) : undefined)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Any"
                                />
                            </div>
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                            </label>
                            <input
                                type="text"
                                value={filters.city || ''}
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter city name"
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Sort By
                            </label>
                            <select
                                value={filters.sortBy || 'newest'}
                                onChange={(e) => handleInputChange('sortBy', e.target.value as SearchFilters['sortBy'])}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="popular">Most Popular</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                            </select>
                        </div>

                        {/* Preferences */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Preferences
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {propertyPreferences.map(preference => (
                                    <label key={preference} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filters.preferences?.includes(preference) || false}
                                            onChange={(e) => handleArrayChange('preferences', preference, e.target.checked)}
                                            className="mr-2 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{preference}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Features */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Features
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {propertyFeatures.map(feature => (
                                    <label key={feature} className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filters.features?.includes(feature) || false}
                                            onChange={(e) => handleArrayChange('features', feature, e.target.checked)}
                                            className="mr-2 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{feature}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Clear All
                        </button>
                        <div className="space-x-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;