import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MoodCard from '../components/MoodCard';
import MovieGrid from '../components/MovieGrid';
import { MOOD_CONFIG } from '../utils/constants';
import { mockMovies } from '../data/mockData';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const resultsVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
  exit:   { opacity: 0, y: -20, transition: { duration: 0.25 } },
};

export default function MoodPage() {
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState(null);

  const moodEntries = Object.entries(MOOD_CONFIG);

  const filteredMovies = useMemo(() => {
    if (!selectedMood) return [];
    const genres = MOOD_CONFIG[selectedMood]?.genres ?? [];
    return mockMovies
      .filter((m) => m.genres.some((g) => genres.includes(g)))
      .slice(0, 12);
  }, [selectedMood]);

  const handleSurpriseMe = () => {
    const random = mockMovies[Math.floor(Math.random() * mockMovies.length)];
    navigate(`/movie/${random.id}`);
  };

  const moodColor = selectedMood ? MOOD_CONFIG[selectedMood]?.color : null;

  return (
    <div className="min-h-screen" style={moodColor ? { background: `radial-gradient(ellipse at top, ${moodColor}10 0%, transparent 60%)` } : {}}>
      <main className="max-w-6xl mx-auto w-full px-6 py-12">

        <AnimatePresence mode="wait">

          {/* ── Mood Grid View ── */}
          {!selectedMood && (
            <motion.div key="grid" variants={resultsVariants} initial="hidden" animate="visible" exit="exit">
              {/* Hero */}
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
                  How are you feeling today?
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Find the perfect movie for your current mood. Select a category below to start your cinematic journey.
                </p>
              </div>

              {/* Mood Cards */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              >
                {moodEntries.map(([mood, { emoji, color }]) => (
                  <motion.div key={mood} variants={cardVariants}>
                    <MoodCard
                      mood={mood}
                      emoji={emoji}
                      color={color}
                      isSelected={false}
                      onClick={() => setSelectedMood(mood)}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Surprise Me */}
              <div className="mt-16 pt-8 border-t border-dark-border">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h4 className="text-xl font-bold text-white">Not sure what to pick?</h4>
                    <p className="text-gray-400 mt-1">Let MovieMate surprise you with a random recommendation.</p>
                  </div>
                  <button
                    onClick={handleSurpriseMe}
                    className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    <Shuffle size={18} />
                    Surprise Me
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Results View ── */}
          {selectedMood && (
            <motion.div key="results" variants={resultsVariants} initial="hidden" animate="visible" exit="exit">
              {/* Back + header */}
              <div className="mb-8">
                <button
                  onClick={() => setSelectedMood(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors mb-6"
                >
                  <ArrowLeft size={16} />
                  Back to moods
                </button>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-4xl">{MOOD_CONFIG[selectedMood].emoji}</span>
                      <h2 className="text-3xl font-bold text-white">
                        Feeling {selectedMood}
                      </h2>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {filteredMovies.length} movies picked for your mood ·{' '}
                      <span className="text-white/60">
                        {MOOD_CONFIG[selectedMood].genres.join(', ')}
                      </span>
                    </p>
                  </div>

                  {/* Mood pills — pick a different mood without going back */}
                  <div className="flex flex-wrap gap-2">
                    {moodEntries.map(([mood, { emoji, color }]) => (
                      <button
                        key={mood}
                        onClick={() => setSelectedMood(mood)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                          ${selectedMood === mood
                            ? 'text-white border-white/30 bg-white/10'
                            : 'text-gray-400 border-dark-border hover:text-white hover:border-white/20'
                          }`}
                      >
                        <span>{emoji}</span>{mood}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mood color accent bar */}
                <div
                  className="mt-4 h-1 w-24 rounded-full"
                  style={{ backgroundColor: MOOD_CONFIG[selectedMood].color }}
                />
              </div>

              {/* Movie Grid with stagger */}
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <MovieGrid
                  movies={filteredMovies}
                  emptyMessage="No movies found for this mood."
                />
              </motion.div>

              {/* Surprise Me (also in results) */}
              <div className="mt-12 pt-8 border-t border-dark-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">Still not finding the right vibe?</p>
                <button
                  onClick={handleSurpriseMe}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg active:scale-95 text-sm"
                >
                  <Shuffle size={16} />
                  Surprise Me
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
