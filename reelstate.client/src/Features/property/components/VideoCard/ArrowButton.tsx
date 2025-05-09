import React, { forwardRef } from 'react';

interface ArrowButtonProps {
    direction: 'left' | 'right';
    onClick: (e: React.MouseEvent) => void;
    visible?: boolean;
    className?: string;
    style?: React.CSSProperties;
    ariaLabel?: string;
}

// Use forwardRef to properly pass refs to the button element
const ArrowButton = forwardRef<HTMLButtonElement, ArrowButtonProps>(({
    direction,
    onClick,
    visible = true,
    className = "backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center",
    style = { width: '34px', height: '34px' },
    ariaLabel
}, ref) => {
    if (!visible) {
        return <div style={style} className="opacity-0"></div>;
    }

    return (
        <button
            ref={ref}
            onClick={onClick}
            className={className}
            style={style}
            aria-label={ariaLabel}
        >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={direction === 'left'
                        ? "M15 19l-7-7 7-7"
                        : "M9 5l7 7-7 7"
                    }
                />
            </svg>
        </button>
    );
});

// Add display name for debugging
ArrowButton.displayName = 'ArrowButton';

export default ArrowButton;