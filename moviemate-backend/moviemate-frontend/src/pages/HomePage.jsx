import { useNavigate, Link } from 'react-router-dom';
import { Play, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import MovieCarousel from '../components/MovieCarousel';
import MovieCard from '../components/MovieCard';
import { mockMovies, mockTrendingMovies, mockRecommendations, mockWatchlist } from '../data/mockData';
import { MOOD_CONFIG } from '../utils/constants';
import { addToWatchlist } from '../services/api';

// Dune: Part Two is mockMovies[2] (id: 3)
const FEATURED = mockMovies[2];

// Flatten recommendations into a single movie list
const recommendedMovies = mockRecommendations.flatMap((r) => r.movies)
  .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function HomePage() {
  const navigate = useNavigate();

  const handleAddToWatchlist = async () => {
    try {
      await addToWatchlist(FEATURED.id);
      toast.success(`"${FEATURED.title}" added to watchlist!`);
    } catch {
      toast.error('Failed to add to watchlist.');
    }
  };

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8">

        {/* ── Hero Banner ── */}
        <motion.section
          variants={fadeUp} initial="hidden" animate="visible"
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-2xl min-h-[340px] md:min-h-[420px] flex items-end p-8 md:p-12"
               style={{ aspectRatio: '21/9' }}>
            {/* Backdrop */}
            <div className="absolute inset-0 z-0">
              <img
                src={FEATURED.backdropUrl}
                alt={FEATURED.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="flex flex-wrap gap-2 mb-2">
                {FEATURED.genres.map((g) => (
                  <span key={g} className="text-xs font-bold uppercase tracking-widest bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded text-gray-300">
                    {g}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase">
                {FEATURED.title}
              </h1>
              <p className="text-base md:text-lg text-gray-200 leading-relaxed line-clamp-2">
                {FEATURED.overview}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => navigate(`/movie/${FEATURED.id}`)}
                  className="flex items-center gap-2 bg-white text-black px-7 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                >
                  <Play size={16} fill="black" />
                  View Details
                </button>
                <button
                  onClick={handleAddToWatchlist}
                  className="flex items-center gap-2 bg-dark-card text-white border border-dark-border px-7 py-3 rounded-lg font-bold text-sm hover:bg-dark-hover transition-all active:scale-95"
                >
                  <Bookmark size={16} />
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Mood Row ── */}
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mb-12"
        >
          <h3 className="text-lg font-bold mb-4 text-white">How are you feeling?</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {Object.entries(MOOD_CONFIG).map(([mood, { emoji }]) => (
              <button
                key={mood}
                onClick={() => navigate('/mood')}
                className="flex shrink-0 items-center gap-2 rounded-full bg-dark-card border border-dark-border px-5 py-2.5 text-sm font-medium text-white hover:border-white/40 hover:bg-dark-hover transition-all"
              >
                <span>{emoji}</span>
                {mood}
              </button>
            ))}
          </div>
        </motion.section>

        {/* ── Recommended For You ── */}
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <MovieCarousel
            title="Recommended For You"
            movies={recommendedMovies}
            seeAllLink="/recommendations"
            variant="default"
          />
        </motion.div>

        {/* ── Trending This Week ── */}
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <MovieCarousel
            title="Trending This Week"
            movies={mockTrendingMovies}
            variant="trending"
          />
        </motion.div>

        {/* ── From Your Watchlist ── */}
        <motion.section
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl font-bold">From Your Watchlist</h2>
            <Link to="/watchlist" className="text-accent text-sm font-bold hover:text-accent-hover transition-colors">
              See All
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {mockWatchlist.slice(0, 6).map((movie) => (
              <div
                key={movie.id}
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-dark-border cursor-pointer"
              >
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = `https://placehold.co/200x300/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`;
                  }}
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                <div className="absolute inset-0 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-semibold line-clamp-2 leading-tight drop-shadow">
                    {movie.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

      </main>
    </div>
  );
}
