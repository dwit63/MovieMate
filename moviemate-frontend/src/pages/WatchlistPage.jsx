import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Film, Star, Trash2, CheckCircle, SlidersHorizontal, Eye, RotateCcw } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import GenreTag from '../components/GenreTag';
import {
  getMovieById,
  getWatchHistory,
  getWatchlist,
  markAsWatched,
  unmarkAsWatched,
} from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';

const SORT_OPTIONS = ['Date Added', 'Rating', 'Title'];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, scale: 0.95, transition: { duration: 0.25 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const formatDate = (dateString) => (
  dateString
    ? new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    : 'Unknown date'
);

const posterSrc = (movie, width = 500) => (
  movie?.poster_path
    ? `https://image.tmdb.org/t/p/w${width}${movie.poster_path}`
    : `https://placehold.co/128x192/1a1a1a/fff?text=${encodeURIComponent(movie?.title || 'Movie')}`
);

export default function WatchlistPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab === 'watched' ? 'watched' : 'watchlist'
  );

  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [isLoadingWatched, setIsLoadingWatched] = useState(false);
  const [watchedLoaded, setWatchedLoaded] = useState(false);
  const [movingBackIds, setMovingBackIds] = useState([]);

  const {
    removeFromList,
    markWatchedInContext,
    moveBackToWatchlistInContext,
    refreshUserMovieData,
  } = useWatchlist();
  const { isAuthenticated } = useAuth();

  const [activeSort, setActiveSort] = useState('Date Added');
  const [activeGenre, setActiveGenre] = useState('All');

  const fetchWatchlist = async () => {
    const data = await getWatchlist();
    setMovies(data.movies || []);
  };

  useEffect(() => {
    const loadWatchlist = async () => {
      if (!isAuthenticated) return;
      try {
        setIsLoading(true);
        await fetchWatchlist();
      } catch (error) {
        console.error('Error fetching watchlist:', error);
        toast.error('Failed to load watchlist');
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchlist();
  }, [isAuthenticated]);

  const fetchHistory = async () => {
    const data = await getWatchHistory();
    const historyEntries = data.history || [];
    const hydrated = await Promise.all(
      historyEntries.map(async (entry) => {
        try {
          const movie = await getMovieById(entry.movie_id);
          return {
            ...movie,
            id: movie.id || entry.movie_id,
            movie_id: entry.movie_id,
            watched_at: entry.watched_at,
          };
        } catch (error) {
          console.error(`Error fetching watched movie ${entry.movie_id}:`, error);
          return {
            id: entry.movie_id,
            movie_id: entry.movie_id,
            title: `Movie #${entry.movie_id}`,
            watched_at: entry.watched_at,
          };
        }
      })
    );
    setWatchedMovies(hydrated);
    setWatchedLoaded(true);
  };

  useEffect(() => {
    if (activeTab !== 'watched' || watchedLoaded || !isAuthenticated) return;

    const loadHistory = async () => {
      try {
        setIsLoadingWatched(true);
        await fetchHistory();
      } catch (error) {
        console.error('Error fetching watch history:', error);
        toast.error('Failed to load watched movies');
      } finally {
        setIsLoadingWatched(false);
      }
    };

    loadHistory();
  }, [activeTab, watchedLoaded, isAuthenticated]);

  const allGenres = useMemo(() => {
    const genres = Array.from(new Set(movies.flatMap((m) => m.genres || [])));
    return ['All', ...genres.sort((a, b) => a.localeCompare(b))];
  }, [movies]);

  const filtered = useMemo(() => {
    const list = activeGenre === 'All'
      ? [...movies]
      : movies.filter((m) => m.genres?.includes(activeGenre));

    if (activeSort === 'Rating') {
      list.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    } else if (activeSort === 'Title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [movies, activeSort, activeGenre]);

  const handleMarkWatched = async (movieId) => {
    try {
      await markAsWatched(movieId);
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
      markWatchedInContext(movieId);
      setWatchedLoaded(false);
      toast.success('Marked as watched!');
    } catch {
      toast.error('Failed to mark as watched');
    }
  };

  const handleMoveBackToWatchlist = async (movie) => {
    const movieId = Number(movie.movie_id || movie.id);
    if (movingBackIds.includes(movieId)) return;

    try {
      setMovingBackIds((prev) => [...prev, movieId]);
      await unmarkAsWatched(movieId);
      setWatchedMovies((prev) =>
        prev.filter((item) => Number(item.movie_id || item.id) !== movieId)
      );
      moveBackToWatchlistInContext(movieId);
      toast.success('Moved back to watchlist');
      await fetchWatchlist();
      await refreshUserMovieData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to move back to watchlist';
      toast.error(message);
    } finally {
      setMovingBackIds((prev) => prev.filter((id) => id !== movieId));
    }
  };

  const handleRemove = async (movieId, title) => {
    if (!window.confirm(`Remove "${title}" from your watchlist?`)) return;
    await removeFromList(movieId);
    setMovies((prev) => prev.filter((m) => m.id !== movieId));
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-screen">
        <main className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-dark-card rounded-2xl animate-pulse" />
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white leading-tight tracking-tight">My Library</h1>
          <p className="text-gray-400 mt-1 text-base">
            {activeTab === 'watchlist'
              ? <>You have <span className="text-white font-semibold">{movies.length} movie{movies.length !== 1 ? 's' : ''}</span> saved</>
              : <>You've watched <span className="text-white font-semibold">{watchedMovies.length} movie{watchedMovies.length !== 1 ? 's' : ''}</span></>
            }
          </p>
        </div>

        <div className="flex gap-1 mb-8 bg-dark-card border border-dark-border rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'watchlist' ? 'bg-accent text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film size={15} />
            Watchlist
          </button>
          <button
            onClick={() => setActiveTab('watched')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'watched' ? 'bg-accent text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Eye size={15} />
            Watched
          </button>
        </div>

        {activeTab === 'watchlist' && (
          <>
            {movies.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex gap-2 flex-wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setActiveSort(opt)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all
                        ${activeSort === opt
                          ? 'bg-accent text-white border-accent'
                          : 'bg-dark-card text-gray-300 border-dark-border hover:border-gray-500'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <SlidersHorizontal size={16} className="text-gray-400" />
                  <select
                    value={activeGenre}
                    onChange={(e) => setActiveGenre(e.target.value)}
                    className="bg-dark-card border border-dark-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500 cursor-pointer"
                  >
                    {allGenres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {movies.length === 0 && (
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-5 text-center"
              >
                <Film size={56} className="text-gray-600" />
                <h2 className="text-2xl font-bold text-white">Your watchlist is empty</h2>
                <p className="text-gray-400 max-w-sm">
                  Add movies you want to watch later and they'll show up here.
                </p>
                <Link
                  to="/explore"
                  className="mt-2 px-8 py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all active:scale-95"
                >
                  Discover Movies
                </Link>
              </Motion.div>
            )}

            {movies.length > 0 && (
              <Motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((movie) => (
                    <Motion.div
                      key={movie.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="flex gap-4 bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-gray-600 transition-colors group"
                    >
                      <div className="shrink-0 w-24 sm:w-32 cursor-pointer" onClick={() => navigate(`/movie/${movie.id}`)}>
                        <img
                          src={posterSrc(movie)}
                          alt={movie.title}
                          className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            e.target.src = `https://placehold.co/128x192/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`;
                          }}
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between py-4 pr-4 min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <h3
                              className="text-white font-semibold text-sm leading-tight cursor-pointer hover:text-accent transition-colors truncate"
                              onClick={() => navigate(`/movie/${movie.id}`)}
                            >
                              {movie.title}
                            </h3>
                            <div className="flex items-center gap-1 shrink-0 bg-dark-secondary border border-dark-border rounded-lg px-2 py-1">
                              <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
                              <span className="text-white text-xs font-bold">{movie.vote_average?.toFixed(1)}</span>
                            </div>
                          </div>

                          <p className="text-gray-500 text-xs mt-1">
                            {movie.release_date?.slice(0, 4)}
                            {movie.runtime ? ` | ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ''}
                          </p>

                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {movie.genres?.map((g) => <GenreTag key={g} genre={g} size="xs" />)}
                          </div>

                          {movie.overview && (
                            <p className="text-gray-400 text-sm mt-3 line-clamp-2 leading-relaxed">{movie.overview}</p>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4 flex-wrap">
                          <button
                            onClick={() => handleMarkWatched(movie.id)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-sm font-bold rounded-lg hover:bg-accent/20 transition-all active:scale-95"
                          >
                            <CheckCircle size={14} />
                            Watched
                          </button>
                          <button
                            onClick={() => handleRemove(movie.id, movie.title)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-dark-secondary border border-dark-border text-gray-400 text-sm font-bold rounded-lg hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all active:scale-95"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </Motion.div>
                  ))}
                </AnimatePresence>
              </Motion.div>
            )}
          </>
        )}

        {activeTab === 'watched' && (
          <>
            {isLoadingWatched && (
              <div className="flex flex-col gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-dark-card rounded-2xl animate-pulse" />
                ))}
              </div>
            )}

            {!isLoadingWatched && watchedMovies.length === 0 && (
              <Motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-5 text-center"
              >
                <Eye size={56} className="text-gray-600" />
                <h2 className="text-2xl font-bold text-white">No watched movies yet</h2>
                <p className="text-gray-400 max-w-sm">
                  Mark movies as watched from your watchlist and they'll appear here.
                </p>
                <button
                  onClick={() => setActiveTab('watchlist')}
                  className="mt-2 px-8 py-3 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all active:scale-95"
                >
                  Go to Watchlist
                </button>
              </Motion.div>
            )}

            {!isLoadingWatched && watchedMovies.length > 0 && (
              <Motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
                {watchedMovies.map((movie) => {
                  const movieId = Number(movie.movie_id || movie.id);
                  const isMoving = movingBackIds.includes(movieId);
                  return (
                    <Motion.div
                      key={movieId}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      className="flex gap-4 bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-gray-600 transition-colors group"
                    >
                      <div className="shrink-0 w-20 sm:w-28 cursor-pointer" onClick={() => navigate(`/movie/${movieId}`)}>
                        <img
                          src={posterSrc(movie)}
                          alt={movie.title}
                          className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            e.target.src = `https://placehold.co/112x168/1a1a1a/fff?text=${encodeURIComponent(movie.title?.slice(0, 2) || '?')}`;
                          }}
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-center py-4 pr-4 min-w-0 gap-1">
                        <h3
                          className="text-white font-semibold text-sm leading-tight cursor-pointer hover:text-accent transition-colors truncate"
                          onClick={() => navigate(`/movie/${movieId}`)}
                        >
                          {movie.title}
                        </h3>

                        <p className="text-gray-500 text-xs">
                          {movie.release_date?.slice(0, 4)}
                          {movie.runtime ? ` | ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ''}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {movie.genres?.slice(0, 3).map((g) => <GenreTag key={g} genre={g} size="xs" />)}
                        </div>

                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <Eye size={11} className="text-gray-600" />
                          Watched {formatDate(movie.watched_at)}
                        </p>

                        <button
                          type="button"
                          disabled={isMoving}
                          onClick={() => handleMoveBackToWatchlist(movie)}
                          className="mt-3 flex w-fit items-center gap-1.5 px-3 py-2 bg-dark-secondary border border-dark-border text-gray-300 text-xs font-bold rounded-lg hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                          <RotateCcw size={13} />
                          {isMoving ? 'Moving...' : 'Move Back to Watchlist'}
                        </button>
                      </div>
                    </Motion.div>
                  );
                })}
              </Motion.div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
