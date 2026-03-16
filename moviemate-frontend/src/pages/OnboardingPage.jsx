import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Film, Rocket, Theater, Smile, Skull, Clock, Video, Music,
  Sparkles, Heart, Search, Compass, CheckCircle, RefreshCw, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import RatingStars from '../components/RatingStars';
import { mockMovies } from '../data/mockData';

const GENRES = [
  { id: 'Action',    label: 'Action',    Icon: Zap },
  { id: 'Sci-Fi',   label: 'Sci-Fi',    Icon: Rocket },
  { id: 'Drama',    label: 'Drama',     Icon: Theater },
  { id: 'Comedy',   label: 'Comedy',    Icon: Smile },
  { id: 'Horror',   label: 'Horror',    Icon: Skull },
  { id: 'History',  label: 'History',   Icon: Clock },
  { id: 'Docu',     label: 'Docu',      Icon: Video },
  { id: 'Musical',  label: 'Musical',   Icon: Music },
  { id: 'Fantasy',  label: 'Fantasy',   Icon: Sparkles },
  { id: 'Romance',  label: 'Romance',   Icon: Heart },
  { id: 'Mystery',  label: 'Mystery',   Icon: Search },
  { id: 'Adventure',label: 'Adventure', Icon: Compass },
];

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const POOL_SIZE = 6;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [selectedGenres, setSelectedGenres] = useState([]);
  const [ratings, setRatings] = useState({});
  const [moviePool, setMoviePool] = useState(() => shuffle(mockMovies).slice(0, POOL_SIZE));

  const toggleGenre = useCallback((id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  }, []);

  const handleRefresh = () => {
    setMoviePool(shuffle(mockMovies).slice(0, POOL_SIZE));
  };

  const handleFinish = () => {
    updateUser({ preferredGenres: selectedGenres, isOnboarded: true });
    navigate('/home');
  };

  const canFinish = selectedGenres.length >= 3;

  return (
    <div className="flex flex-col min-h-screen bg-dark text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark/80 backdrop-blur-md border-b border-dark-border px-6 py-4 flex items-center justify-between">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-7 h-7 text-white" />
            <h1 className="text-xl font-bold tracking-tight">MovieMate</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-widest hidden sm:block">
              Progress
            </span>
            <div className="bg-dark-card border border-dark-border rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-sm font-bold">
                {selectedGenres.length}/3 selected
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 pb-36">
        {/* Genre Section */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Pick Your Favourite Genres</h2>
            <p className="text-gray-400">Select at least 3 to personalize your movie recommendations.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {GENRES.map(({ id, label, Icon }) => {
              const selected = selectedGenres.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleGenre(id)}
                  className={`group relative aspect-square rounded-xl bg-dark-card p-4 flex flex-col items-center justify-center gap-3 transition-all border-2
                    ${selected
                      ? 'border-white bg-white/5'
                      : 'border-dark-border hover:border-gray-500'
                    }`}
                >
                  <Icon
                    className={`w-7 h-7 transition-colors ${selected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
                  />
                  <span className={`font-medium text-sm transition-colors ${selected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                    {label}
                  </span>
                  {selected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Rating Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Rate a Few Movies</h2>
              <p className="text-gray-400">Tell us what you've seen to improve your feed.</p>
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh list
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
            {moviePool.map((movie) => (
              <div key={movie.id} className="min-w-[180px] flex flex-col gap-3 group flex-shrink-0">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-dark-card border border-dark-border">
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs text-white font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                      View Details
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm truncate">{movie.title}</h3>
                  <p className="text-xs text-gray-400">{movie.year} • {movie.genres[0]}</p>
                  <div className="mt-2">
                    <RatingStars
                      rating={ratings[movie.id] ?? 0}
                      size="sm"
                      onRate={(val) => setRatings((prev) => ({ ...prev, [movie.id]: val }))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Sticky Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-dark/95 backdrop-blur-xl border-t border-dark-border py-5 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="text-gray-400 hover:text-white font-medium text-sm transition-colors"
          >
            Skip for now
          </button>
          <div className="flex items-center gap-4">
            <p className="hidden md:block text-xs text-gray-400 text-right leading-relaxed">
              You can always update these<br />preferences in settings.
            </p>
            <button
              type="button"
              onClick={handleFinish}
              disabled={!canFinish}
              className="bg-white text-black px-10 py-3 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Finish Setup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
