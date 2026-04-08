import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Rocket, Heart, Gem } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieCard from '../components/MovieCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getRecommendations, getGenresYouLove, getHiddenGems } from '../services/api';

const sectionFade = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function RecommendationsPage() {
  const navigate = useNavigate();

  const [sections, setSections] = useState([]);
  const [genrePicks, setGenrePicks] = useState([]);
  const [hiddenGems, setHiddenGems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);

      const [recsData, genresData, gemsData] = await Promise.all([
        getRecommendations().catch(() => ({ sections: [] })),
        getGenresYouLove().catch(() => ({ genres: [] })),
        getHiddenGems().catch(() => ({ movies: [] })),
      ]);

      setSections(recsData.sections || []);
      setGenrePicks(genresData.genres || []);
      setHiddenGems(gemsData.movies || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRecommendations();
  }, [fetchAllRecommendations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Building your recommendations..." />
      </div>
    );
  }

  return (
    <div className="w-full">
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        {/* Page Title */}
        <motion.div
          variants={sectionFade} initial="hidden" animate="visible"
          className="flex flex-wrap items-end justify-between gap-6 mb-10"
        >
          <div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">Your Personalized Picks</h1>
            <p className="text-gray-400 mt-2 text-lg">Curated lists based on your viewing history and preferences.</p>
          </div>
          <button
            onClick={fetchAllRecommendations}
            className="flex items-center gap-2 rounded-lg h-12 px-6 bg-dark-card border border-dark-border text-white font-bold hover:bg-dark-hover transition-all active:scale-95"
          >
            <RefreshCw size={16} />
            Refresh Recommendations
          </button>
        </motion.div>

        {/* ── "Because You Like..." sections ── */}
        {sections.length > 0 ? (
          sections.map((section, index) => (
            <motion.section
              key={index}
              variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <Rocket size={20} className="text-accent" />
                <h2 className="text-2xl font-bold text-white">
                  {section.title}
                </h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">{section.reason}</p>

              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {section.movies.map((movie) => (
                  <div key={movie.id} className="w-40 flex-shrink-0">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </motion.section>
          ))
        ) : (
          <motion.div
            variants={sectionFade} initial="hidden" animate="visible"
            className="mb-12 p-8 bg-dark-card border border-dark-border rounded-2xl text-center"
          >
            <p className="text-gray-400 text-lg">Rate some movies to get personalized recommendations!</p>
            <button
              onClick={() => navigate('/explore')}
              className="mt-4 px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all"
            >
              Explore Movies
            </button>
          </motion.div>
        )}

        {/* ── Genres You Love ── */}
        {genrePicks.length > 0 && (
          <motion.section
            variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart size={20} className="text-accent" />
              <h2 className="text-2xl font-bold text-white">Genres You Love</h2>
            </div>

            {/* Genre pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {genrePicks.map((g) => (
                <span
                  key={g.genre_id}
                  className="px-4 py-1.5 rounded-full text-sm font-bold bg-accent text-white"
                >
                  {g.genre_name}
                  {g.count > 0 && (
                    <span className="ml-1.5 text-white/70 text-xs">({g.count})</span>
                  )}
                </span>
              ))}
            </div>

            {/* Featured movies grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {genrePicks.map((g) =>
                g.featured_movie ? (
                  <div key={g.genre_id}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {g.genre_name} Pick
                    </p>
                    <MovieCard movie={g.featured_movie} />
                  </div>
                ) : null
              )}
            </div>
          </motion.section>
        )}

        {/* ── Hidden Gems ── */}
        {hiddenGems.length > 0 && (
          <motion.section
            variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-20"
          >
            <div className="bg-gradient-to-br from-accent/10 to-transparent p-px rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-dark/80 backdrop-blur-xl p-8 rounded-3xl">
                <div className="flex items-center gap-3 mb-8">
                  <Gem size={28} className="text-accent" />
                  <h2 className="text-3xl font-black italic tracking-tight text-white">Hidden Gems</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  High-quality movies with ratings ≥7.5 that most people haven't discovered yet.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
                  {hiddenGems.map((movie) => (
                    <div
                      key={movie.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/movie/${movie.id}`)}
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-dark-border bg-dark-card mb-3">
                        <img
                          src={
                            movie.poster_path
                              ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                              : `https://placehold.co/160x240/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`
                          }
                          alt={movie.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                          onError={(e) => {
                            e.target.src = `https://placehold.co/160x240/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <button className="w-full py-1.5 bg-white text-black rounded font-bold text-xs">
                            View Movie
                          </button>
                        </div>
                      </div>
                      <h5 className="text-white font-bold text-sm truncate">{movie.title}</h5>
                      <p className="text-gray-500 text-[10px] uppercase font-bold mt-0.5 tracking-tighter">
                        ★ {movie.vote_average?.toFixed(1)} · Hidden Gem
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

      </main>
    </div>
  );
}
