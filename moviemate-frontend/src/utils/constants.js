export const API_BASE_URL = 'http://localhost:8000/api';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const POSTER_SIZES = {
  small: '/w185',
  medium: '/w342',
  large: '/w500',
  original: '/original',
};

export const MOOD_CONFIG = {
  Happy: {
    emoji: '😄',
    color: '#F59E0B',
    genres: ['Comedy', 'Animation', 'Family', 'Musical'],
  },
  Sad: {
    emoji: '😢',
    color: '#6B7280',
    genres: ['Drama', 'Romance', 'Biography'],
  },
  Excited: {
    emoji: '🤩',
    color: '#EF4444',
    genres: ['Action', 'Adventure', 'Superhero', 'Blockbuster'],
  },
  Relaxed: {
    emoji: '😌',
    color: '#10B981',
    genres: ['Documentary', 'Nature', 'Slice of Life', 'Travel'],
  },
  Scared: {
    emoji: '😱',
    color: '#7C3AED',
    genres: ['Horror', 'Thriller', 'Supernatural', 'Suspense'],
  },
  Thoughtful: {
    emoji: '🤔',
    color: '#3B82F6',
    genres: ['Sci-Fi', 'Mystery', 'Philosophical', 'Drama'],
  },
  Romantic: {
    emoji: '💕',
    color: '#EC4899',
    genres: ['Romance', 'Drama', 'Comedy', 'Date Night'],
  },
  Adventurous: {
    emoji: '🌍',
    color: '#F97316',
    genres: ['Adventure', 'Action', 'Fantasy', 'Epic'],
  },
};

export const GENRE_COLORS = {
  'Action': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Adventure': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Animation': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Comedy': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Crime': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Documentary': 'bg-green-600/20 text-green-400 border-green-600/30',
  'Drama': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Family': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Fantasy': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'History': 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  'Horror': 'bg-red-700/20 text-red-500 border-red-700/30',
  'Music': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Mystery': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  'Romance': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  'Sci-Fi': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Science Fiction': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'Thriller': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'War': 'bg-neutral-600/20 text-neutral-400 border-neutral-600/30',
  'Western': 'bg-yellow-700/20 text-yellow-600 border-yellow-700/30',
  'Cyberpunk': 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  'Superhero': 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  'Biography': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'default': 'bg-gray-700/20 text-gray-400 border-gray-700/30',
};
