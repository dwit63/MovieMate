import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getWatchlistIds,
  getUserRatingIds,
  addToWatchlist,
  removeFromWatchlist,
  rateMovie,
} from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [watchlistIds, setWatchlistIds] = useState([]);
  const [userRatings, setUserRatings] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const refreshUserMovieData = useCallback(async () => {
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

      setWatchlistIds((watchlistData.movie_ids || []).map(Number));
      setUserRatings(ratingsData.ratings || {});
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUserMovieData();
  }, [refreshUserMovieData]);

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
        setWatchlistIds((prev) => [...prev, Number(movieId)]);
        toast.success('Added to watchlist!');
      }
    } catch (error) {
      if (error.response?.status === 400) {
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
    } catch {
      toast.error('Failed to remove');
    }
  };

  const markWatchedInContext = (movieId) => {
    setWatchlistIds((prev) => prev.filter((id) => id !== Number(movieId)));
  };

  const moveBackToWatchlistInContext = (movieId) => {
    setWatchlistIds((prev) =>
      prev.includes(Number(movieId)) ? prev : [Number(movieId), ...prev]
    );
  };

  const getUserRating = (movieId) => {
    return userRatings[String(movieId)] || null;
  };

  const submitRating = async (movieId, rating) => {
    try {
      await rateMovie(movieId, rating);
      setUserRatings((prev) => ({ ...prev, [String(movieId)]: rating }));
      toast.success(`Rated ${rating} star${rating !== 1 ? 's' : ''}!`);
    } catch {
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
    markWatchedInContext,
    moveBackToWatchlistInContext,
    refreshUserMovieData,
    getUserRating,
    submitRating,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}

export default WatchlistContext;
