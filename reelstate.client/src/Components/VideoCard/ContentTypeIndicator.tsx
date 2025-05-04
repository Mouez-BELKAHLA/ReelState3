import React from 'react';

interface ContentTypeIndicatorProps {
    isVideoMode: boolean;
    isPhotoMode: boolean;
    isLocationMode: boolean;
    activeIndex: number;
    photosLength: number;
    isAnimating: boolean;
}

const ContentTypeIndicator: React.FC<ContentTypeIndicatorProps> = ({
    isVideoMode,
    isPhotoMode,
    isLocationMode,
    activeIndex,
    photosLength,
    isAnimating
}) => {
    // Get the appropriate color based on the active mode
    const getIndicatorColor = () => {
        if (isVideoMode) return 'from-purple-500 to-blue-500';
        if (isPhotoMode) return 'from-amber-500 to-rose-500';
        if (isLocationMode) return 'from-emerald-500 to-teal-500';
        return 'from-white to-white';
    };

    // Get the appropriate text for the indicator
    const getIndicatorText = () => {
        if (isVideoMode) return 'VIDEO';
        if (isLocationMode) return 'LOCALISATION';
        return `PHOTO ${activeIndex}/${photosLength}`;
    };

    return (
        <div className="absolute top-6 left-4 z-20">
            <div
                className={`
          backdrop-blur-lg
          bg-transparent
          py-1 px-3
          rounded-md
          border border-white/30
          transition-all duration-150
          overflow-hidden
          relative
          ${isAnimating ? 'scale-105' : ''}
        `}
            >
                {/* Background animated gradient when changing */}
                <div
                    className={`
            absolute inset-0 
            bg-gradient-to-r ${getIndicatorColor()}
            ${isAnimating ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-300
          `}
                    style={{
                        animation: isAnimating ? 'pulseGradient 0.4s ease-out' : 'none'
                    }}
                />

                {/* Text content */}
                <span className="text-white text-xs font-medium relative z-10">
                    {getIndicatorText()}
                </span>
            </div>
        </div>
    );
};

export default ContentTypeIndicator;