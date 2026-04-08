import { useNavigate, Link } from 'react-router-dom';
import { Play, Bookmark, Check } from 'lucide-react';  // ← NEW: Check added
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import MovieCarousel from '../components/MovieCarousel';
import { MOOD_CONFIG } from '../utils/constants';
import { getTrendingMovies, getTopRatedMovies, getWatchlist } from '../services/api';  // ← NEW: getWatchlist, removed addToWatchlist
import { useWatchlist } from '../context/WatchlistContext';  // ← NEW
import { useAuth } from '../context/AuthContext';            // ← NEW

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function HomePage() {
  const navigate = useNavigate();

  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── NEW: Real watchlist section state ──
  const [watchlistMovies, setWatchlistMovies] = useState([]);

  // ── NEW: Replace local handleAddToWatchlist with context ──
  const { isAuthenticated } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const trendingData = await getTrendingMovies();
        setTrendingMovies(trendingData.movies || []);

        if (trendingData.movies && trendingData.movies.length > 0) {
          setHeroMovie(trendingData.movies[0]);
        }

        const topRatedData = await getTopRatedMovies();
        setTopRatedMovies(topRatedData.movies || []);

      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── NEW: Fetch real watchlist separately (only when logged in) ──
  useEffect(() => {
    if (!isAuthenticated) {
      setWatchlistMovies([]);
      return;
    }
    const fetchWatchlist = async () => {
      try {
        const data = await getWatchlist();
        setWatchlistMovies(data.movies?.slice(0, 6) || []);
      } catch (error) {
        console.error('Error fetching watchlist:', error);
      }
    };
    fetchWatchlist();
  }, [isAuthenticated]);

  // ── NEW: Derived from context — no local state needed ──
  const heroInWatchlist = heroMovie ? isInWatchlist(heroMovie.id) : false;

  return (
    <div className="w-full">
      <main className="mx-auto w-full max-w-7xl px-4 md:px-10 py-8">

        {/* ── Hero Banner ── */}
        <motion.section
          variants={fadeUp} initial="hidden" animate="visible"
          className="mb-12"
        >
          {heroMovie && (
            <div
              className="relative overflow-hidden rounded-2xl min-h-[340px] md:min-h-[420px] flex items-end p-8 md:p-12"
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                aspectRatio: '21/9',
              }}
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />

              {/* Content */}
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {heroMovie.genres?.map((g) => (
                    <span
                      key={g}
                      className="text-xs font-bold uppercase tracking-widest bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded text-gray-300"
                    >
                      {g}
                    </span>
                  ))}
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase">
                  {heroMovie.title}
                </h1>
                <p className="text-base md:text-lg text-gray-200 leading-relaxed line-clamp-2">
                  {heroMovie.overview}
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/movie/${heroMovie.id}`)}
                    className="flex items-center gap-2 bg-white text-black px-7 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Play size={16} fill="black" />
                    View Details
                  </button>
                  {/* ── NEW: Uses context toggleWatchlist, shows real state ── */}
                  {isAuthenticated && (
                    <button
                      onClick={() => toggleWatchlist(heroMovie.id)}
                      className={`flex items-center gap-2 px-7 py-3 rounded-lg font-bold text-sm border active:scale-95 transition-all
                        ${heroInWatchlist
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-dark-card text-white border-dark-border hover:bg-dark-hover'
                        }`}
                    >
                      {heroInWatchlist ? (
                        <><Check size={16} /> In Watchlist</>
                      ) : (
                        <><Bookmark size={16} /> Add to Watchlist</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading skeleton for hero */}
          {isLoading && !heroMovie && (
            <div className="rounded-2xl min-h-[340px] md:min-h-[420px] bg-dark-card animate-pulse" />
          )}
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

        {/* ── Trending This Week ── */}
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <MovieCarousel
            title="Trending This Week"
            movies={trendingMovies}
            variant="trending"
          />
        </motion.div>

        {/* ── Top Rated ── */}
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        >
          <MovieCarousel
            title="Top Rated"
            movies={topRatedMovies}
            seeAllLink="/explore"
            variant="default"
          />
        </motion.div>

        {/* ── From Your Watchlist ── */}
        {/* ── NEW: Only show section when logged in and watchlist has movies ── */}
        {isAuthenticated && watchlistMovies.length > 0 && (
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
              {watchlistMovies.map((movie) => (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-dark-border cursor-pointer"
                >
                  <img
                    src={
                      movie.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                        : `https://placehold.co/200x300/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`
                    }
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
        )}

      </main>
    </div>
  );
}