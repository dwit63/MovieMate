import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Pencil, BarChart3, Star, Settings, SlidersHorizontal,
  Share2, Trash2, Plus, Film,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { mockUserProfile, mockRatings, mockMovies } from '../data/mockData';

const GENRE_BARS = [
  { label: 'SCI-FI',  pct: 85, color: 'bg-accent' },
  { label: 'ACTION',  pct: 65, color: 'bg-gray-500' },
  { label: 'DRAMA',   pct: 45, color: 'bg-gray-600' },
  { label: 'COMEDY',  pct: 30, color: 'bg-gray-700' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: 'easeOut', delay: i * 0.08 },
  }),
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

  const [name, setName] = useState(mockUserProfile.name);
  const [password, setPassword] = useState('');

  // Join last 3 ratings with movie data
  const recentRatings = useMemo(() => {
    return [...mockRatings]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .map((r) => {
        const movie = mockMovies.find((m) => m.id === r.movieId);
        return movie ? { ...r, movie } : null;
      })
      .filter(Boolean);
  }, []);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    updateUser({ name });
    toast.success('Profile updated!');
    setPassword('');
  };

  const handleDeleteAccount = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );
    if (confirmed) {
      logout();
      navigate('/');
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const { stats } = mockUserProfile;

  return (
    <div className="w-full min-h-screen">
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* Profile Header */}
            <motion.section
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="flex flex-col md:flex-row items-center md:items-end gap-6 bg-dark-card border border-dark-border rounded-2xl p-8"
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-28 h-28 rounded-full ring-4 ring-accent/20 overflow-hidden bg-dark-secondary">
                  <img
                    src={mockUserProfile.avatar}
                    alt={mockUserProfile.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://placehold.co/150x150/1a1a1a/ffffff?text=${
                        mockUserProfile.name.slice(0, 2).toUpperCase()
                      }`;
                    }}
                  />
                </div>
                <button
                  className="absolute bottom-0 right-0 p-1.5 bg-accent hover:bg-accent-hover text-white rounded-full shadow-lg transition-colors"
                  aria-label="Edit avatar"
                >
                  <Pencil size={12} />
                </button>
              </div>

              {/* Info */}
              <div className="text-center md:text-left flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-white truncate">{mockUserProfile.name}</h2>
                <p className="text-gray-400 text-sm mt-0.5">{mockUserProfile.email}</p>
                <p className="text-gray-500 text-xs mt-1">Member since {mockUserProfile.memberSince}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <button className="px-5 py-2 bg-accent hover:bg-accent-hover text-white font-bold text-sm rounded-xl transition-all active:scale-95">
                  Follow
                </button>
                <button
                  className="px-3 py-2 bg-dark border border-dark-border text-gray-400 hover:text-white rounded-xl transition-colors"
                  aria-label="Share profile"
                >
                  <Share2 size={16} />
                </button>
              </div>
            </motion.section>

            {/* Activity Overview */}
            <motion.section
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="bg-dark-card border border-dark-border rounded-2xl p-8"
            >
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-6">
                <BarChart3 size={18} className="text-accent" />
                Activity Overview
              </h3>

              {/* Stat boxes */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Rated',      value: stats.rated },
                  { label: 'Avg Rating', value: stats.avgRating },
                  { label: 'Top Genre',  value: stats.topGenre, accent: true },
                  { label: 'Watchlist',  value: stats.watchlist },
                  { label: 'Watched',    value: stats.watched },
                ].map(({ label, value, accent }) => (
                  <div
                    key={label}
                    className="p-4 bg-dark border border-dark-border rounded-xl text-center col-span-1 last:col-span-2 md:last:col-span-1"
                  >
                    <p className={`text-xl font-bold truncate px-1 ${accent ? 'text-accent' : 'text-white'}`}>
                      {value}
                    </p>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Genre Distribution */}
              <div className="mt-8">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Genre Distribution
                </p>
                <div className="space-y-3.5">
                  {GENRE_BARS.map(({ label, pct, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500 w-14 shrink-0">{label}</span>
                      <div className="flex-1 bg-dark h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`${color} h-full rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Recently Rated */}
            <motion.section
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="bg-dark-card border border-dark-border rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-white">Recently Rated</h3>
                <button className="text-sm text-accent hover:underline font-medium">View All</button>
              </div>

              <div className="space-y-3">
                {recentRatings.map(({ movieId, rating, date, movie }) => (
                  <button
                    key={movieId}
                    onClick={() => navigate(`/movie/${movieId}`)}
                    className="flex items-center gap-4 w-full p-3 bg-dark border border-dark-border hover:border-dark-hover rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-14 rounded overflow-hidden shrink-0 bg-dark-secondary">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = `https://placehold.co/40x56/252525/ffffff?text=${encodeURIComponent(movie.title.slice(0, 2))}`;
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm leading-tight truncate">{movie.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Rated on {formatDate(date)}</p>
                    </div>
                    <div className="flex items-center gap-1 text-star shrink-0">
                      <Star size={14} fill="currentColor" />
                      <span className="font-bold text-sm text-white">{rating.toFixed(1)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.section>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="lg:col-span-4 space-y-6">

            {/* Edit Profile */}
            <motion.section
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="bg-dark-card border border-dark-border rounded-2xl p-6"
            >
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-6">
                <Settings size={18} className="text-accent" />
                Edit Profile
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-dark border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-dark border border-dark-border rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all text-sm"
                    placeholder="Leave blank to keep current"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-dark-secondary hover:bg-dark-hover text-white font-bold text-sm rounded-xl border border-dark-border transition-colors active:scale-95"
                >
                  Update Profile
                </button>
              </form>
            </motion.section>

            {/* Preferences */}
            <motion.section
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="bg-dark-card border border-dark-border rounded-2xl p-6"
            >
              <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
                <SlidersHorizontal size={18} className="text-accent" />
                Preferences
              </h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                Preferred Genres
              </p>
              <div className="flex flex-wrap gap-2">
                {mockUserProfile.preferredGenres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold border border-accent/20"
                  >
                    {genre}
                  </span>
                ))}
                <button className="px-3 py-1 rounded-full border border-dashed border-dark-border text-gray-500 text-xs font-bold hover:text-gray-300 hover:border-gray-500 transition-colors flex items-center gap-1">
                  <Plus size={12} />
                  Add More
                </button>
              </div>
            </motion.section>

            {/* Danger Zone */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-center py-2"
            >
              <button
                onClick={handleDeleteAccount}
                className="text-red-500/50 hover:text-red-500 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 mx-auto"
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}
