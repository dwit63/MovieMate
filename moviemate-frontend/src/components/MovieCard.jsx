import { useNavigate } from 'react-router-dom';
import { Star, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import GenreTag from './GenreTag';

export default function MovieCard({ movie, variant = 'default' }) {
  const navigate = useNavigate();
  const [inWatchlist, setInWatchlist] = useState(false);

  if (!movie) return null;

  // ── Normalise fields — works with both TMDB data and old mock data ──
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : movie.posterUrl
    || `https://placehold.co/300x450/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
    : movie.backdropUrl
    || posterUrl;

  const year = movie.release_date?.slice(0, 4) || movie.year || '';
  const rating = movie.vote_average ?? movie.rating ?? 0;

  const handleClick = () => navigate(`/movie/${movie.id}`);
  const handleWatchlist = (e) => {
    e.stopPropagation();
    setInWatchlist((prev) => !prev);
  };

  // ── Watchlist variant ──────────────────────────────────────────────────────
  if (variant === 'watchlist') {
    return (
      <div
        onClick={handleClick}
        className="flex gap-3 bg-dark-card border border-dark-border rounded-xl overflow-hidden cursor-pointer hover:border-accent/40 transition-all hover:bg-dark-hover group"
      >
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-16 h-24 object-cover flex-shrink-0"
          onError={(e) => { e.target.src = `https://placehold.co/64x96/1a1a1a/ffffff?text=N/A`; }}
        />
        <div className="flex flex-col justify-center py-2 pr-3 gap-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate group-hover:text-accent transition-colors">
            {movie.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Star size={11} fill="#F59E0B" stroke="#F59E0B" />
            <span>{rating.toFixed(1)}</span>
            <span>·</span>
            <span>{year}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {movie.genres?.slice(0, 2).map((g) => (
              <GenreTag key={g} genre={g} size="xs" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Trending variant ───────────────────────────────────────────────────────
  if (variant === 'trending') {
    return (
      <div
        onClick={handleClick}
        className="relative flex-shrink-0 w-64 rounded-xl overflow-hidden cursor-pointer group"
      >
        <img
          src={backdropUrl}
          alt={movie.title}
          className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { e.target.src = `https://placehold.co/256x144/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`; }}
        />
        <div className="absolute inset-0 hero-gradient flex flex-col justify-end p-3">
          <div className="flex items-center gap-1 mb-1">
            <Star size={11} fill="#F59E0B" stroke="#F59E0B" />
            <span className="text-star text-xs font-medium">{rating.toFixed(1)}</span>
          </div>
          <h3 className="text-white font-semibold text-sm leading-tight">{movie.title}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{year}</p>
        </div>
      </div>
    );
  }

  // ── Default variant ────────────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      className="bg-dark-card rounded-xl overflow-hidden cursor-pointer group hover:scale-105 transition-transform duration-200 border border-dark-border hover:border-accent/30"
    >
      <div className="relative">
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full aspect-[2/3] object-cover"
          onError={(e) => { e.target.src = `https://placehold.co/300x450/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`; }}
        />
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star size={11} fill="#F59E0B" stroke="#F59E0B" />
          <span className="text-star text-xs font-bold">{rating.toFixed(1)}</span>
        </div>
        <button
          onClick={handleWatchlist}
          className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent"
        >
          {inWatchlist ? (
            <Check size={13} className="text-white" />
          ) : (
            <Plus size={13} className="text-white" />
          )}
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate group-hover:text-accent transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-gray-500 text-xs">{year}</span>
          {movie.genres?.[0] && (
            <>
              <span className="text-gray-600 text-xs">·</span>
              <span className="text-gray-500 text-xs truncate">{movie.genres[0]}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}