import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shuffle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MovieGrid from '../components/MovieGrid';
import LoadingSpinner from '../components/LoadingSpinner';
import { getMoods, getMoodMovies, getPopularMovies } from '../services/api';

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

  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodMovies, setMoodMovies] = useState([]);
  const [moodInfo, setMoodInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  // Fetch moods on mount
  useEffect(() => {
    const fetchMoods = async () => {
      try {
        const data = await getMoods();
        setMoods(data.moods || []);
      } catch (error) {
        console.error('Error fetching moods:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMoods();
  }, []);

  // Handle mood selection
  const handleMoodClick = async (moodId) => {
    try {
      setSelectedMood(moodId);
      setIsLoadingMovies(true);

      const data = await getMoodMovies(moodId);
      setMoodMovies(data.movies || []);
      setMoodInfo({
        name: data.mood,
        emoji: data.emoji,
        color: data.color,
        description: data.description,
        genre_names: data.genre_names || [],
      });
    } catch (error) {
      console.error('Error fetching mood movies:', error);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleBackToMoods = () => {
    setSelectedMood(null);
    setMoodMovies([]);
    setMoodInfo(null);
  };

  // Surprise Me — navigate to a random popular movie
  const handleSurpriseMe = async () => {
    try {
      const data = await getPopularMovies();
      const movies = data.movies || [];
      if (movies.length > 0) {
        const random = movies[Math.floor(Math.random() * movies.length)];
        navigate(`/movie/${random.id}`);
      }
    } catch {
      // silent fail
    }
  };

  const moodColor = moodInfo?.color || null;

  return (
    <div
      className="min-h-screen"
      style={moodColor ? { background: `radial-gradient(ellipse at top, ${moodColor}10 0%, transparent 60%)` } : {}}
    >
      <main className="max-w-6xl mx-auto w-full px-6 py-12">

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <LoadingSpinner size="lg" text="Loading moods..." />
          </div>
        ) : (
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
                  {moods.map((mood) => (
                    <motion.div key={mood.id} variants={cardVariants}>
                      <div
                        onClick={() => handleMoodClick(mood.id)}
                        className="bg-dark-card border border-dark-border rounded-xl p-8 text-center cursor-pointer hover:scale-[1.02] transition-all hover:border-white/20"
                      >
                        <span className="text-6xl">{mood.emoji}</span>
                        <h3 className="text-white font-semibold text-xl mt-3">{mood.name}</h3>
                        <p className="text-gray-500 text-xs mt-2 line-clamp-2">{mood.description}</p>
                        <div
                          className="w-10 h-1 rounded-full mx-auto mt-3"
                          style={{ backgroundColor: mood.color }}
                        />
                      </div>
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
                    onClick={handleBackToMoods}
                    className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition-colors mb-6"
                  >
                    <ArrowLeft size={16} />
                    Back to moods
                  </button>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-4xl">{moodInfo?.emoji}</span>
                        <h2 className="text-3xl font-bold text-white">
                          Feeling {moodInfo?.name}
                        </h2>
                      </div>
                      <p className="text-gray-400 text-sm">
                        {moodMovies.length} movies picked ·{' '}
                        <span className="text-white/60">
                          {moodInfo?.genre_names?.join(', ')}
                        </span>
                      </p>
                    </div>

                    {/* Quick mood switcher pills */}
                    <div className="flex flex-wrap gap-2">
                      {moods.map((mood) => (
                        <button
                          key={mood.id}
                          onClick={() => handleMoodClick(mood.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                            ${selectedMood === mood.id
                              ? 'text-white border-white/30 bg-white/10'
                              : 'text-gray-400 border-dark-border hover:text-white hover:border-white/20'
                            }`}
                        >
                          <span>{mood.emoji}</span>{mood.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className="mt-4 h-1 w-24 rounded-full"
                    style={{ backgroundColor: moodInfo?.color }}
                  />
                </div>

                {/* Movies */}
                {isLoadingMovies ? (
                  <div className="flex items-center justify-center py-20">
                    <LoadingSpinner size="lg" text="Finding movies for your mood..." />
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible">
                    <MovieGrid
                      movies={moodMovies}
                      emptyMessage="No movies found for this mood."
                    />
                  </motion.div>
                )}

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
        )}
      </main>
    </div>
  );
}
