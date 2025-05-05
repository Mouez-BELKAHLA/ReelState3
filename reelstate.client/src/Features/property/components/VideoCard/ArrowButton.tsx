import React from 'react';

interface ArrowButtonProps {
    direction: 'left' | 'right';
    onClick: (e: React.MouseEvent) => void;
    visible?: boolean;
    className?: string;
    style?: React.CSSProperties;
    ariaLabel?: string;
    ref?: React.RefObject<HTMLButtonElement>;
}

const ArrowButton: React.FC<ArrowButtonProps> = ({
    direction,
    onClick,
    visible = true,
    className = "backdrop-blur-lg bg-black/30 rounded-full p-1.5 hover:bg-white/20 transition-all border border-white/20 flex items-center justify-center",
    style = { width: '34px', height: '34px' },
    ariaLabel,
    ref
}) => {
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
};

export default ArrowButton;