import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MovieCard from './MovieCard';

export default function MovieCarousel({
  title,
  movies = [],
  seeAllLink,
  variant = 'default',
}) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = dir === 'left' ? -300 : 300;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  if (!movies.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {seeAllLink && (
            <Link
              to={seeAllLink}
              className="text-accent text-sm hover:text-accent-hover transition-colors mr-2"
            >
              See all
            </Link>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-dark-card border border-dark-border hover:bg-dark-hover transition-colors"
          >
            <ChevronLeft size={16} className="text-gray-400" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-dark-card border border-dark-border hover:bg-dark-hover transition-colors"
          >
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
      >
        {movies.map((movie) => (
          <div
            key={movie.id}
            className={variant === 'trending' ? 'flex-shrink-0' : 'flex-shrink-0 w-40'}
          >
            <MovieCard movie={movie} variant={variant} />
          </div>
        ))}
      </div>
    </section>
  );
}
