import React from 'react';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  hoveredRating?: number;
  onHover?: (rating: number) => void;
  onHoverEnd?: () => void;
}

export default function RatingStars({
  rating,
  count,
  size = 'md',
  interactive = false,
  onRate,
  hoveredRating,
  onHover,
  onHoverEnd,
}: RatingStarsProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const displayRating = hoveredRating !== undefined ? hoveredRating : rating;

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate?.(star)}
            onMouseEnter={() => interactive && onHover?.(star)}
            onMouseLeave={() => interactive && onHoverEnd?.()}
            disabled={!interactive}
            className={`${sizeMap[size]} transition-all duration-150 ${
              star <= Math.round(displayRating)
                ? 'text-[#FF9B51] scale-110'
                : 'text-[#BFC9D1] scale-100'
            } ${interactive ? 'cursor-pointer hover:scale-125' : 'cursor-default'}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {renderStars()}
      {rating > 0 && (
        <>
          <span className="text-sm font-semibold text-[#25343F]">
            {displayRating.toFixed(1)}
          </span>
          {count !== undefined && (
            <span className="text-xs text-[#25343F]/50 font-medium">
              ({count})
            </span>
          )}
        </>
      )}
    </div>
  );
}
