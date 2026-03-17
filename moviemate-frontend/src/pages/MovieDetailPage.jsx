import { useState, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play, Plus, Check, Sparkles, Star, ChevronLeft, ChevronRight, CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import GenreTag from '../components/GenreTag';
import RatingStars from '../components/RatingStars';
import TrailerModal from '../components/TrailerModal';
import { mockMovies } from '../data/mockData';
import { addToWatchlist, removeFromWatchlist } from '../services/api';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

function formatRuntime(mins) {
  if (!mins) return '';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function getSimilar(movie) {
  return mockMovies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 8)
    .map((m, i) => ({ ...m, matchPercent: Math.max(75, 95 - i * 3) }));
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const movie = mockMovies.find((m) => m.id === Number(id));

  const [inWatchlist, setInWatchlist] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);

  const carouselRef = useRef(null);
  const scroll = (dir) => {
    carouselRef.current?.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  const similar = useMemo(() => (movie ? getSimilar(movie) : []), [movie]);

  const handleWatchlist = async () => {
    try {
      if (inWatchlist) {
        await removeFromWatchlist(movie.id);
        toast('Removed from watchlist');
      } else {
        await addToWatchlist(movie.id);
        toast.success(`"${movie.title}" added to watchlist!`);
      }
      setInWatchlist((v) => !v);
    } catch {
      toast.error('Something went wrong.');
    }
  };

  // ── Not Found ──────────────────────────────────────────────────────────────
  if (!movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-2xl font-bold">Movie not found.</p>
        <Link to="/explore" className="text-accent hover:underline text-sm">← Back to Explore</Link>
      </div>
    );
  }

  return (
    <>
      <TrailerModal
        trailerKey={movie.trailerKey}
        title={movie.title}
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
      />

      <div className="relative flex flex-col overflow-x-hidden">

        {/* ── Hero Backdrop ── */}
        <section className="relative h-[85vh] min-h-[520px] w-full">
          <div className="absolute inset-0 z-0">
            <img
              src={movie.backdropUrl}
              alt={movie.title}
              className="h-full w-full object-cover"
              onError={(e) => { e.target.src = `https://placehold.co/1200x600/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark/60 to-dark" />
          </div>

          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-12 lg:px-20">
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible"
              className="flex flex-col gap-8 md:flex-row md:items-end"
            >
              {/* Poster */}
              <div className="shrink-0">
                <img
                  src={movie.posterUrl}
                  alt={`${movie.title} poster`}
                  className="w-40 md:w-56 rounded-xl shadow-2xl border border-white/10"
                  onError={(e) => { e.target.src = `https://placehold.co/224x336/1a1a1a/fff?text=${encodeURIComponent(movie.title)}`; }}
                />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {movie.genres.map((g) => (
                    <GenreTag key={g} genre={g} size="sm" />
                  ))}
                  <span className="text-gray-400 text-sm font-medium">
                    {movie.year}{movie.runtime ? ` • ${formatRuntime(movie.runtime)}` : ''}
                  </span>
                </div>

                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">{movie.title}</h2>

                {movie.tagline && (
                  <p className="max-w-xl text-lg font-medium italic text-gray-400">{movie.tagline}</p>
                )}

                <div className="flex items-center gap-6 mt-1">
                  <div className="flex items-center gap-2">
                    <Star size={20} fill="#F59E0B" stroke="#F59E0B" />
                    <span className="text-xl font-bold text-white">
                      {movie.rating}
                      <span className="text-sm font-normal text-gray-400">/10</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Your rating</span>
                    <RatingStars
                      rating={userRating}
                      size="md"
                      onRate={setUserRating}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={() => setTrailerOpen(true)}
                    className="flex items-center gap-2 bg-white text-black px-7 py-3 rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
                  >
                    <Play size={16} fill="black" />
                    Watch Trailer
                  </button>
                  <button
                    onClick={handleWatchlist}
                    className={`flex items-center gap-2 px-7 py-3 rounded-lg font-bold text-sm border active:scale-95 transition-all
                      ${inWatchlist
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-dark-card border-dark-border text-white hover:bg-dark-hover'
                      }`}
                  >
                    {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
                    {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Body ── */}
        <main className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-12">

              {/* Overview */}
              <motion.section variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <h3 className="mb-4 text-2xl font-bold text-white">Overview</h3>
                <p className="text-lg leading-relaxed text-gray-400">{movie.overview}</p>
                {movie.director && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-500 mb-1">Director</p>
                    <span className="text-lg font-bold text-white">{movie.director}</span>
                  </div>
                )}
              </motion.section>

              {/* Cast */}
              {movie.cast?.length > 0 && (
                <motion.section variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-white">Top Cast</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                    {movie.cast.map((member) => (
                      <div key={member.name} className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-dark-card">
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://placehold.co/56x56/1a1a1a/fff?text=${encodeURIComponent(member.name[0])}`;
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{member.name}</p>
                          <p className="text-xs text-gray-400 truncate">{member.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            {/* Right column — AI Card */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="sticky top-24 rounded-2xl bg-dark-card border border-dark-border p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-accent" />
                  <h4 className="text-lg font-bold text-white">Why You Might Like This</h4>
                </div>
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-gray-400">
                    Based on your interest in{' '}
                    <span className="text-white font-medium">Inception</span> and{' '}
                    <span className="text-white font-medium">Gravity</span>,{' '}
                    {movie.title} offers a similar blend of high-concept storytelling and stunning visuals.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Epic scale and stunning visual effects.',
                      `Directed by ${movie.director || 'a visionary filmmaker'}.`,
                      'A mind-bending narrative with emotional depth.',
                    ].map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-400">{point}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-dark-border">
                    <p className="text-xs font-bold text-accent uppercase tracking-widest">AI Prediction</p>
                    <p className="text-2xl font-black text-white mt-1">98% Match</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Similar Movies */}
          {similar.length > 0 && (
            <motion.section
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="mt-16"
            >
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Similar Movies</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => scroll('left')}
                    className="rounded-full bg-dark-card border border-dark-border p-2 text-white hover:bg-dark-hover transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    className="rounded-full bg-dark-card border border-dark-border p-2 text-white hover:bg-dark-hover transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div ref={carouselRef} className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                {similar.map((m) => (
                  <div key={m.id} className="min-w-[160px] flex-shrink-0 group cursor-pointer"
                       onClick={() => navigate(`/movie/${m.id}`)}>
                    <div className="relative overflow-hidden rounded-xl border border-dark-border bg-dark-card mb-3 aspect-[2/3]">
                      <img
                        src={m.posterUrl}
                        alt={m.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => { e.target.src = `https://placehold.co/160x240/1a1a1a/fff?text=${encodeURIComponent(m.title)}`; }}
                      />
                      <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {m.matchPercent}% Match
                      </div>
                    </div>
                    <h5 className="font-bold text-white text-sm truncate">{m.title}</h5>
                    <p className="text-xs text-gray-500 mt-0.5">{m.year} · {m.genres[0]}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/movie/${m.id}`); }}
                      className="mt-2 w-full rounded-md bg-white/5 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </main>
      </div>
    </>
  );
}
