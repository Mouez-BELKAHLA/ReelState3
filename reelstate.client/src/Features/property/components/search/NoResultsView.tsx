import React from 'react';

interface NoResultsViewProps {
    isAiSearch: boolean;
    searchQuery: string;
    aiQueryInput: string;
    setAiQueryInput: (value: string) => void;
    onClearSearch: () => void;
    onAiSearch: () => void;
}

export const NoResultsView: React.FC<NoResultsViewProps> = ({
    isAiSearch,
    searchQuery,
    aiQueryInput,
    setAiQueryInput,
    onClearSearch,
    onAiSearch
}) => {
    return (
        <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d={isAiSearch ?
                        "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" :
                        "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"} />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {isAiSearch ? "AI " : ""}matches found</h3>
            <p className="text-gray-600 mb-4">
                {isAiSearch ?
                    "Try using different words to describe what you're looking for." :
                    "Try adjusting your search terms or filters to find what you're looking for."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                    onClick={onClearSearch}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    Browse All Properties
                </button>

                {!isAiSearch && (
                    <button
                        onClick={() => {
                            setAiQueryInput(searchQuery || '');
                            setTimeout(() => onAiSearch(), 100);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Try AI Search Instead
                    </button>
                )}
            </div>
        </div>
    );
};