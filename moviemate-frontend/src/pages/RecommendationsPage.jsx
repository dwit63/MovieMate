import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Rocket, Cpu, Heart, Gem } from 'lucide-react';
import { motion } from 'framer-motion';
import RecommendationCard from '../components/RecommendationCard';
import GenreTag from '../components/GenreTag';
import { mockRecommendations, mockMovies } from '../data/mockData';
import { getHiddenGems } from '../services/api';

// ── Static hidden gems (pulled from mockMovies, rated ≥7.5, pre-2020) ────────
const HIDDEN_GEMS_IDS = [7, 12, 13, 15, 16]; // BR2049, Arrival, Contact, Matrix, Ex Machina
const buildGems = (seed = 0) =>
  [...HIDDEN_GEMS_IDS]
    .sort(() => ((seed * 9301 + 49297) % 233280) / 233280 - 0.5)
    .map((id, i) => ({
      movie: mockMovies.find((m) => m.id === id),
      matchPercent: [94, 91, 89, 92, 88][i % 5],
    }))
    .filter((g) => g.movie);

// ── Genre picks (backdrop-style cards) ───────────────────────────────────────
const GENRE_PICKS = [
  { genre: 'Sci-Fi',   label: 'Sci-Fi Pick',   movieId: 3  },
  { genre: 'Action',   label: 'Action Pick',    movieId: 14 },
  { genre: 'Drama',    label: 'Drama Pick',     movieId: 4  },
  { genre: 'Thriller', label: 'Thriller Pick',  movieId: 11 },
];
const ALL_GENRE_LABELS = ['Sci-Fi', 'Action', 'Drama', 'Thriller', 'Adventure', 'Mystery'];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
const sectionFade = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

// ── "Because You Liked" row ───────────────────────────────────────────────────
const BLURBS = [
  'Similar themes of complex realities and high-concept storytelling.',
  'Focuses on scientific problem solving and space exploration.',
  'Visually stunning with deeply emotional narrative.',
  'Deeply emotional story with an alien communication concept.',
  'Explores the intersection of science and belief systems.',
  'Mind-bending saga of reality and simulation.',
  'High-octane cyberpunk vibes and visual mastery.',
  'Tense psychological thriller on android ethics.',
];

function BecauseLikedRow({ title, movies, icon: Icon, seed }) {
  const navigate = useNavigate();
  return (
    <motion.section variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Icon size={20} className="text-accent" />
        <h2 className="text-2xl font-bold text-white">
          Because You Liked <span className="text-accent italic">{title}</span>
        </h2>
      </div>
      <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide"
      >
        {movies.map((movie, i) => (
          <motion.div
            key={movie.id}
            variants={fadeUp}
            className="flex flex-col gap-3 min-w-[200px] flex-shrink-0 group cursor-pointer"
            onClick={() => navigate(`/movie/${movie.id}`)}
          >
            <div className="relative aspect-[2/3] w-full bg-dark-card rounded-xl overflow-hidden shadow-lg border border-dark-border group-hover:scale-[1.02] transition-transform duration-300">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = `https://placehold.co/200x300/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`; }}
              />
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-xs font-bold">
                {movie.matchPercent ?? Math.max(80, 98 - i * 3)}% Match
              </div>
            </div>
            <div className="bg-dark-card border border-dark-border p-3 rounded-xl flex-1">
              <h3 className="text-white font-bold text-base mb-1 group-hover:text-accent transition-colors truncate">
                {movie.title}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">
                {BLURBS[(seed + i) % BLURBS.length]}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const navigate = useNavigate();
  const [activeGenres, setActiveGenres] = useState(['Sci-Fi']);
  const [gemSeed, setGemSeed] = useState(0);
  const [recSeed, setRecSeed] = useState(0);

  const handleRefresh = useCallback(() => {
    setGemSeed((s) => s + 1);
    setRecSeed((s) => s + 1);
  }, []);

  const toggleGenre = (g) =>
    setActiveGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  // Build "Because You Liked" sections from mockRecommendations
  const rec0 = mockRecommendations[0];
  const rec1 = mockRecommendations[1];

  // Shift order based on recSeed
  const rec0Movies = [...rec0.movies].sort(() => (recSeed % 2 === 0 ? 1 : -1));
  const rec1Movies = [...rec1.movies].sort(() => (recSeed % 2 === 0 ? -1 : 1));

  const gems = buildGems(gemSeed);

  // Genre-filtered backdrop picks
  const visibleGenrePicks = GENRE_PICKS.filter(
    (p) => activeGenres.length === 0 || activeGenres.includes(p.genre)
  );
  const displayedPicks = visibleGenrePicks.length > 0 ? visibleGenrePicks : GENRE_PICKS;

  return (
    <div className="w-full">
      <main className="max-w-7xl mx-auto px-6 md:px-10 py-8">

        {/* Page Title */}
        <motion.div variants={sectionFade} initial="hidden" animate="visible"
          className="flex flex-wrap items-end justify-between gap-6 mb-10"
        >
          <div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight">Your Personalized Picks</h1>
            <p className="text-gray-400 mt-2 text-lg">Curated lists based on your viewing history and preferences.</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg h-12 px-6 bg-dark-card border border-dark-border text-white font-bold hover:bg-dark-hover transition-all active:scale-95"
          >
            <RefreshCw size={16} />
            Refresh Recommendations
          </button>
        </motion.div>

        {/* ── Because You Liked rows ── */}
        <BecauseLikedRow
          title={rec0.seedMovie}
          movies={rec0Movies}
          icon={Rocket}
          seed={recSeed}
        />
        <BecauseLikedRow
          title={rec1.seedMovie}
          movies={rec1Movies}
          icon={Cpu}
          seed={recSeed + 3}
        />

        {/* ── Genres You Love ── */}
        <motion.section variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <Heart size={20} className="text-accent" />
              <h2 className="text-2xl font-bold text-white">Genres You Love</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRE_LABELS.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all border
                    ${activeGenres.includes(g)
                      ? 'bg-accent text-white border-accent'
                      : 'bg-dark-card text-gray-300 border-dark-border hover:border-gray-500'
                    }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <motion.div
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {displayedPicks.map(({ genre, label, movieId }) => {
              const movie = mockMovies.find((m) => m.id === movieId);
              if (!movie) return null;
              return (
                <motion.div
                  key={genre}
                  variants={fadeUp}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                >
                  <div className="relative aspect-video w-full bg-dark-card rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={movie.backdropUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { e.target.src = `https://placehold.co/400x225/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-accent/20 backdrop-blur-md text-accent text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                        {label}
                      </span>
                      <h4 className="text-white font-bold text-lg mt-1 leading-tight">{movie.title}</h4>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.section>

        {/* ── Hidden Gems ── */}
        <motion.section variants={sectionFade} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-20">
          <div className="bg-gradient-to-br from-accent/10 to-transparent p-px rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-dark/80 backdrop-blur-xl p-8 rounded-3xl">
              <div className="flex items-center gap-3 mb-8">
                <Gem size={28} className="text-accent" />
                <h2 className="text-3xl font-black italic tracking-tight text-white">Hidden Gems</h2>
              </div>

              <motion.div
                variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5"
              >
                {gems.map(({ movie, matchPercent }, i) => (
                  <motion.div
                    key={`${movie.id}-${gemSeed}`}
                    variants={fadeUp}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  >
                    <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-dark-border bg-dark-card mb-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        onError={(e) => { e.target.src = `https://placehold.co/160x240/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <button className="w-full py-1.5 bg-white text-black rounded font-bold text-xs">
                          View Movie
                        </button>
                      </div>
                    </div>
                    <h5 className="text-white font-bold text-sm truncate">{movie.title}</h5>
                    <p className="text-gray-500 text-[10px] uppercase font-bold mt-0.5 tracking-tighter">
                      {matchPercent}% Hidden Match
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>

      </main>
    </div>
  );
}
