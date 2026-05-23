import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, CalendarDays, ExternalLink, Film, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { getRatingStats, getUserRatings } from '../services/api';

const emptyStats = {
  total_rated: 0,
  average_rating: 0,
  highest_rated: null,
  lowest_rated: null,
  rating_breakdown: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const posterUrl = (movie, title) => (
  movie?.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : `https://placehold.co/342x513/1a1a1a/ffffff?text=${encodeURIComponent(title || 'Movie')}`
);

export default function RatedMoviesPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(emptyStats);
  const [ratings, setRatings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRatedMovies = async () => {
      try {
        setIsLoading(true);
        setError('');
        const [ratingsData, statsData] = await Promise.all([
          getUserRatings(),
          getRatingStats(),
        ]);
        setRatings(ratingsData.ratings || []);
        setStats({ ...emptyStats, ...statsData });
      } catch (err) {
        console.error('Error loading rated movies:', err);
        setError('Failed to load your rated movies.');
        toast.error('Failed to load rated movies');
      } finally {
        setIsLoading(false);
      }
    };

    loadRatedMovies();
  }, []);

  const ratedMovies = useMemo(() => (
    ratings.map((item) => {
      const movie = item.movie || {};
      const movieId = movie.id || item.movie_id;
      const title = movie.title || 'Unknown movie';
      return {
        ...item,
        movie,
        movieId,
        title,
        year: movie.release_date?.slice(0, 4) || '',
      };
    })
  ), [ratings]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading rated movies..." />
      </div>
    );
  }

  const breakdown = stats.rating_breakdown || emptyStats.rating_breakdown;
  const maxBreakdown = Math.max(...Object.values(breakdown).map(Number), 1);

  return (
    <div className="w-full min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <p className="text-accent text-sm font-bold uppercase tracking-widest mb-2">
            Your Ratings
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Rated Movies
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            Review the movies you have scored and see how your ratings stack up.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {ratedMovies.length === 0 ? (
          <section className="bg-dark-card border border-dark-border rounded-2xl py-24 px-6 text-center">
            <Film size={56} className="mx-auto text-gray-600 mb-5" />
            <h2 className="text-2xl font-bold text-white">You haven't rated any movies yet.</h2>
            <p className="text-gray-400 mt-2 max-w-md mx-auto">
              Rate movies from their detail pages and your personal rating history will appear here.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center mt-6 px-7 py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all active:scale-95"
            >
              Explore Movies
            </Link>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Movies Rated', value: stats.total_rated ?? 0, icon: <Film size={17} className="text-accent shrink-0" /> },
                { label: 'Average Rating', value: Number(stats.average_rating || 0).toFixed(1), icon: <BarChart3 size={17} className="text-accent shrink-0" /> },
                { label: 'Highest Rating', value: stats.highest_rated ? Number(stats.highest_rated.rating).toFixed(1) : 'N/A', icon: <Star size={17} className="text-accent shrink-0" /> },
                { label: 'Lowest Rating', value: stats.lowest_rated ? Number(stats.lowest_rated.rating).toFixed(1) : 'N/A', icon: <Star size={17} className="text-accent shrink-0" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-dark-card border border-dark-border rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
                    {icon}
                  </div>
                  <p className="text-2xl font-black text-white mt-3">{value}</p>
                </div>
              ))}
            </section>

            <section className="bg-dark-card border border-dark-border rounded-2xl p-5 sm:p-6 mb-8">
              <h2 className="text-base font-semibold text-white mb-5">Rating Breakdown</h2>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = Number(breakdown[String(star)] || 0);
                  return (
                    <div key={star} className="grid grid-cols-[44px_1fr_40px] items-center gap-3">
                      <div className="flex items-center gap-1 text-sm font-bold text-white">
                        {star}
                        <Star size={13} fill="currentColor" className="text-star" />
                      </div>
                      <div className="h-2.5 bg-dark rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(count / maxBreakdown) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-400 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">All Rated Movies</h2>
                <span className="text-sm text-gray-500">{ratedMovies.length} total</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ratedMovies.map(({ movieId, title, year, rating, rated_at, movie }) => (
                  <article
                    key={movieId}
                    className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-gray-600 transition-colors"
                  >
                    <div className="flex gap-4 p-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/movie/${movieId}`)}
                        className="w-20 shrink-0 rounded-xl overflow-hidden bg-dark-secondary text-left"
                        aria-label={`View ${title}`}
                      >
                        <img
                          src={posterUrl(movie, title)}
                          alt={title}
                          className="w-full aspect-[2/3] object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.src = `https://placehold.co/160x240/1a1a1a/ffffff?text=${encodeURIComponent(title.slice(0, 2))}`;
                          }}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/movie/${movieId}`)}
                          className="text-left w-full"
                        >
                          <h3 className="text-white font-bold leading-tight truncate hover:text-accent transition-colors">
                            {title}
                          </h3>
                        </button>
                        <p className="text-gray-500 text-xs mt-1">{year || 'Year unknown'}</p>

                        <div className="flex items-center gap-1 mt-3 text-star">
                          <Star size={15} fill="currentColor" />
                          <span className="text-white font-black text-sm">{Number(rating).toFixed(1)}</span>
                          <span className="text-gray-500 text-xs">your rating</span>
                        </div>

                        <p className="flex items-center gap-1.5 text-gray-500 text-xs mt-2">
                          <CalendarDays size={12} />
                          {formatDate(rated_at)}
                        </p>

                        <button
                          type="button"
                          onClick={() => navigate(`/movie/${movieId}`)}
                          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-accent hover:text-blue-300 transition-colors"
                        >
                          View details
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
