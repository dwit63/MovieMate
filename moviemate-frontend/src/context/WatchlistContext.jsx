import { createContext, useContext, useState, useEffect } from 'react';
import { getWatchlistIds, getUserRatingIds, addToWatchlist, removeFromWatchlist, rateMovie } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isAuthenticated) {
        setWatchlistIds([]);
        setUserRatings({});
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const [watchlistData, ratingsData] = await Promise.all([
          getWatchlistIds(),
          getUserRatingIds(),
        ]);

        // ── FIX: Always store IDs as Numbers so includes() works reliably
        // Backend may return strings or ints depending on SQLite — normalise here
        setWatchlistIds((watchlistData.movie_ids || []).map(Number));

        // Ratings keys from JSON are always strings e.g. { "550": 4.5 }
        // We keep them as strings and always look up with String(id)
        setUserRatings(ratingsData.ratings || {});
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [isAuthenticated]);

  // ── FIX: Normalise incoming movieId to Number before comparing ──
  const isInWatchlist = (movieId) => {
    return watchlistIds.includes(Number(movieId));
  };

  const toggleWatchlist = async (movieId) => {
    try {
      if (isInWatchlist(movieId)) {
        await removeFromWatchlist(movieId);
        setWatchlistIds((prev) => prev.filter((id) => id !== Number(movieId)));
        toast.success('Removed from watchlist');
      } else {
        await addToWatchlist(movieId);
        setWatchlistIds((prev) => [...prev, Number(movieId)]); // ← store as Number
        toast.success('Added to watchlist!');
      }
    } catch (error) {
      if (error.response?.status === 400) {
        // Backend says already in watchlist — sync local state and show neutral toast
        setWatchlistIds((prev) =>
          prev.includes(Number(movieId)) ? prev : [...prev, Number(movieId)]
        );
        toast('Already in your watchlist');
      } else {
        const message = error.response?.data?.detail || 'Something went wrong';
        toast.error(message);
      }
    }
  };

  const removeFromList = async (movieId) => {
    try {
      await removeFromWatchlist(movieId);
      setWatchlistIds((prev) => prev.filter((id) => id !== Number(movieId)));
      toast.success('Removed from watchlist');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  // ── FIX: Always look up ratings with String key since JSON keys are strings ──
  const getUserRating = (movieId) => {
    return userRatings[String(movieId)] || null;
  };

  const submitRating = async (movieId, rating) => {
    try {
      await rateMovie(movieId, rating);
      setUserRatings((prev) => ({ ...prev, [String(movieId)]: rating })); // ← store as String key
      toast.success(`Rated ${rating} star${rating !== 1 ? 's' : ''}!`);
    } catch (error) {
      toast.error('Failed to save rating');
    }
  };

  const value = {
    watchlistIds,
    userRatings,
    isLoading,
    isInWatchlist,
    toggleWatchlist,
    removeFromList,
    getUserRating,
    submitRating,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

export default WatchlistContext;