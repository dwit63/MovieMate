import { GENRE_COLORS } from '../utils/constants';

export default function GenreTag({ genre, size = 'sm', onClick }) {
  const colorClass = GENRE_COLORS[genre] || GENRE_COLORS['default'];
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-block rounded-full border font-medium ${colorClass} ${sizeClasses[size]} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
    >
      {genre}
    </span>
  );
}
