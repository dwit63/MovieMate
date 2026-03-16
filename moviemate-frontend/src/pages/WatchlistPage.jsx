import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Film, Star, Trash2, CheckCircle, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import GenreTag from '../components/GenreTag';
import { mockWatchlist } from '../data/mockData';

const SORT_OPTIONS = ['Date Added', 'Rating', 'Title'];

const ALL_GENRES = ['All', ...Array.from(new Set(mockWatchlist.flatMap((m) => m.genres)))].sort((a, b) =>
  a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)
);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, scale: 0.95, transition: { duration: 0.25 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(() =>
    mockWatchlist.map((m, i) => ({ ...m, addedIndex: i }))
  );
  const [activeSort, setActiveSort] = useState('Date Added');
  const [activeGenre, setActiveGenre] = useState('All');

  const filtered = useMemo(() => {
    let list = activeGenre === 'All'
      ? [...watchlist]
      : watchlist.filter((m) => m.genres.includes(activeGenre));

    if (activeSort === 'Rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (activeSort === 'Title') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => a.addedIndex - b.addedIndex);
    }
    return list;
  }, [watchlist, activeSort, activeGenre]);

  const markWatched = (id) => {
    setWatchlist((prev) => prev.filter((m) => m.id !== id));
    toast.success('Marked as watched!');
  };

  const removeMovie = (id, title) => {
    if (!window.confirm(`Remove "${title}" from your watchlist?`)) return;
    setWatchlist((prev) => prev.filter((m) => m.id !== id));
    toast('Removed from watchlist');
  };

  return (
    <div className="w-full min-h-screen">
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-10">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">My Watchlist</h1>
            <p className="text-gray-400 mt-1 text-base">
              You have{' '}
              <span className="text-white font-semibold">{watchlist.length} movie{watchlist.length !== 1 ? 's' : ''}</span>
              {' '}saved
            </p>
          </div>

          {/* Genre dropdown */}
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={16} className="text-gray-400" />
            <select
              value={activeGenre}
              onChange={(e) => setActiveGenre(e.target.value)}
              className="bg-dark-card border border-dark-border text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500 cursor-pointer"
            >
              {ALL_GENRES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort Pills */}
        <div className="flex gap-2 mb-8 flex-wrap">
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

        {/* Empty State */}
        {watchlist.length === 0 && (
          <motion.div
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
          </motion.div>
        )}

        {/* Movie List */}
        {watchlist.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((movie) => (
                <motion.div
                  key={movie.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="flex gap-4 bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-gray-600 transition-colors group"
                >
                  {/* Poster */}
                  <div
                    className="shrink-0 w-24 sm:w-32 cursor-pointer"
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  >
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="h-full w-full object-cover group-hover:opacity-90 transition-opacity"
                      onError={(e) => {
                        e.target.src = `https://placehold.co/128x192/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`;
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between py-4 pr-4 min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <h3
                          className="text-white font-bold text-lg leading-tight cursor-pointer hover:text-accent transition-colors truncate"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                        >
                          {movie.title}
                        </h3>
                        {/* Rating badge */}
                        <div className="flex items-center gap-1 shrink-0 bg-dark-secondary border border-dark-border rounded-lg px-2 py-1">
                          <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
                          <span className="text-white text-xs font-bold">{movie.rating}</span>
                        </div>
                      </div>

                      <p className="text-gray-500 text-sm mt-1">
                        {movie.year}
                        {movie.runtime ? ` · ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : ''}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {movie.genres.map((g) => (
                          <GenreTag key={g} genre={g} size="xs" />
                        ))}
                      </div>

                      {movie.overview && (
                        <p className="text-gray-400 text-sm mt-3 line-clamp-2 leading-relaxed">
                          {movie.overview}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button
                        onClick={() => markWatched(movie.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-accent/10 border border-accent/30 text-accent text-sm font-bold rounded-lg hover:bg-accent/20 transition-all active:scale-95"
                      >
                        <CheckCircle size={14} />
                        Watched
                      </button>
                      <button
                        onClick={() => removeMovie(movie.id, movie.title)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-dark-secondary border border-dark-border text-gray-400 text-sm font-bold rounded-lg hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all active:scale-95"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Filter-empty state */}
            {filtered.length === 0 && watchlist.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-center py-16"
              >
                No movies match the selected genre.
              </motion.p>
            )}
          </motion.div>
        )}

      </main>
    </div>
  );
}
