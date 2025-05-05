import React from 'react';

interface CarouselIndicatorsProps {
    totalItems: number;
    activeIndex: number;
    onClick: (index: number) => void;
}

const CarouselIndicators: React.FC<CarouselIndicatorsProps> = ({ totalItems, activeIndex, onClick }) => {
    return (
        <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 z-20">
            {[...Array(totalItems)].map((_, index) => (
                <button
                    key={index}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${activeIndex === index ? 'bg-white w-4' : 'bg-white/40'}`}
                    aria-label={index === 0 ? "View video" : index === totalItems - 1 ? "View location" : `View photo ${index}`}
                />
            ))}
        </div>
    );
};

export default CarouselIndicators;