import { useState } from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({
  rating = 0,
  maxStars = 5,
  readonly = false,
  size = 'md',
  onRate,
}) {
  const [hovered, setHovered] = useState(0);

  const sizeMap = { sm: 14, md: 18, lg: 24 };
  const px = sizeMap[size] || 18;

  const displayRating = readonly ? rating : (hovered || rating);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < displayRating;
        return (
          <Star
            key={i}
            size={px}
            fill={filled ? '#F59E0B' : 'transparent'}
            stroke={filled ? '#F59E0B' : '#6B7280'}
            className={readonly ? '' : 'cursor-pointer transition-transform hover:scale-110'}
            onMouseEnter={() => !readonly && setHovered(i + 1)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onRate && onRate(i + 1)}
          />
        );
      })}
    </div>
  );
}
