import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import GenreTag from './GenreTag';

export default function RecommendationCard({ movie }) {
  const navigate = useNavigate();

  if (!movie) return null;

  return (
    <div className="flex gap-4 bg-dark-card border border-dark-border rounded-xl overflow-hidden hover:border-accent/30 transition-all group">
      <div className="relative flex-shrink-0 w-28">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = `https://placehold.co/112x168/1a1a1a/ffffff?text=N/A`; }}
        />
        {movie.matchPercent && (
          <div className="absolute top-2 left-2 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            {movie.matchPercent}%
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center py-4 pr-4 gap-2 flex-1 min-w-0">
        <h3 className="text-white font-semibold text-base truncate group-hover:text-accent transition-colors">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Star size={13} fill="#F59E0B" stroke="#F59E0B" />
          <span>{movie.rating}</span>
          <span>·</span>
          <span>{movie.year}</span>
        </div>
        <p className="text-gray-500 text-xs line-clamp-2">{movie.overview}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {movie.genres?.slice(0, 3).map((g) => (
            <GenreTag key={g} genre={g} size="xs" />
          ))}
        </div>
        <button
          onClick={() => navigate(`/movie/${movie.id}`)}
          className="mt-1 self-start px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors"
        >
          View Movie
        </button>
      </div>
    </div>
  );
}
