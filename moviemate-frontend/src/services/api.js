/**
 * src/services/api.js — API Service
 *
 * This file handles ALL communication between the frontend and backend.
 *
 * HOW IT WORKS:
 * 1. We create an "axios instance" with the backend URL from Vite env
 * 2. We add an "interceptor" that automatically attaches the JWT token to every request
 * 3. We export functions that the rest of the app can call
 *
 * WHAT IS AXIOS?
 * Axios is a library for making HTTP requests. It's like fetch() but easier to use.
 * axios.post("/signup", data) → sends a POST request to the backend with the data
 * axios.get("/me") → sends a GET request to get data from the backend
 */

import axios from 'axios';

// Create an axios instance with the backend base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * REQUEST INTERCEPTOR
 *
 * This runs BEFORE every request is sent to the backend.
 * It checks if there's a JWT token in localStorage.
 * If there is, it adds it to the request header as:
 *   Authorization: Bearer <token>
 *
 * This is how the backend knows who's making the request.
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('moviemate_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * RESPONSE INTERCEPTOR
 *
 * This runs AFTER every response comes back from the backend.
 * If we get a 401 (Unauthorized) error, it means the token is expired or invalid.
 * We clear the stored token and redirect to the login page.
 */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const hadToken = !!localStorage.getItem('moviemate_token');
      localStorage.removeItem('moviemate_token');
      // Redirect to login only if the user had a token (expired session),
      // not on intentional unauthenticated requests.
      if (hadToken && !error.config.url.includes('/auth/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTHENTICATION API CALLS
// ============================================================

/**
 * Sign up a new user.
 * Sends: { name, email, password }
 * Receives: { token, user, message }
 */
export const signupUser = async (name, email, password) => {
  const response = await API.post('/auth/signup', { name, email, password });
  return response.data;
};

/**
 * Log in an existing user.
 * Sends: { email, password }
 * Receives: { token, user, message }
 */
export const loginUser = async (email, password) => {
  const response = await API.post('/auth/login', { email, password });
  return response.data;
};

/**
 * Get current user info (used to check if token is still valid on app load).
 * Sends: nothing (token is in the header automatically)
 * Receives: { id, name, email, preferred_genres, is_onboarded }
 */
export const getCurrentUser = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};

/**
 * Update user profile.
 * Sends: { name?, password?, preferred_genres?, is_onboarded? }
 * Receives: updated user object
 */
export const updateProfile = async (updateData) => {
  const response = await API.put('/auth/profile', updateData);
  return response.data;
};

/**
 * Complete onboarding — save genre preferences + initial ratings.
 */
export const completeOnboarding = async (preferredGenres, ratings) => {
  const response = await API.post('/auth/onboarding', {
    preferred_genres: preferredGenres,
    ratings: ratings
  });
  return response.data;
};

// ============================================================
// MOVIE API CALLS (Phase 3 — placeholders for now)
// ============================================================

/**
 * Get trending movies this week.
 * Used on: Home page hero + trending section
 */
export const getTrendingMovies = async (page = 1) => {
  const response = await API.get('/movies/trending', { params: { page } });
  return response.data;
};

/**
 * Get top rated movies.
 * Used on: Home page top rated section
 */
export const getTopRatedMovies = async (page = 1) => {
  const response = await API.get('/movies/top-rated', { params: { page } });
  return response.data;
};

/**
 * Get popular movies.
 * Used on: Explore page default grid
 */
export const getPopularMovies = async (page = 1) => {
  const response = await API.get('/movies/popular', { params: { page } });
  return response.data;
};

/**
 * Search movies by title.
 * Used on: Search bar auto-suggest + Search Results page
 */
export const searchMovies = async (query, page = 1) => {
  const response = await API.get('/movies/search', { params: { q: query, page } });
  return response.data;
};

/**
 * Get full details for a single movie.
 * Used on: MovieDetail page
 */
export const getMovieById = async (id) => {
  const response = await API.get(`/movies/${id}`);
  return response.data;
};

/**
 * Get list of all genres.
 * Used on: Explore page filter sidebar + Onboarding page
 */
export const getGenres = async () => {
  const response = await API.get('/movies/genres');
  return response.data;
};

/**
 * Discover movies with advanced filters.
 * Used on: Explore page when filters are applied
 */
export const discoverMovies = async (filters = {}) => {
  const response = await API.get('/movies/discover', { params: filters });
  return response.data;
};
// ============================================================
// RECOMMENDATION API CALLS
// ============================================================

/**
 * Get all available moods.
 * Used on: Mood page grid, Home page mood pills.
 */
export const getMoods = async () => {
  const response = await API.get('/recommend/moods');
  return response.data;
};

/**
 * Get movie recommendations for a specific mood.
 * Used on: Mood page results after clicking a mood.
 */
export const getMoodMovies = async (mood, page = 1) => {
  const response = await API.get(`/recommend/mood/${mood}`, { params: { page } });
  return response.data;
};

/**
 * Get personalized recommendations based on user's rating history.
 * Used on: Home page "Recommended For You", Recommendations page.
 */
export const getRecommendations = async (page = 1) => {
  const response = await API.get('/recommend/personalized', { params: { page } });
  return response.data;
};

/**
 * Get top movies from user's favorite genres.
 * Used on: Recommendations page "Genres You Love" section.
 */
export const getGenresYouLove = async () => {
  const response = await API.get('/recommend/genres-you-love');
  return response.data;
};

/**
 * Get hidden gem movies (high quality, less popular).
 * Used on: Recommendations page "Hidden Gems" section.
 */
export const getHiddenGems = async (page = 1) => {
  const response = await API.get('/recommend/hidden-gems', { params: { page } });
  return response.data;
};

// ============================================================
// ML RECOMMENDATION API CALLS
// ============================================================

/**
 * Get ML-powered similar movies for a specific movie.
 * Returns similarity scores + explanation strings.
 * Used on: MovieDetail page "Similar Movies" section.
 */
export const getSimilarMoviesML = async (movieId, limit = 10) => {
  const response = await API.get(`/recommend/similar/${movieId}`, { params: { limit } });
  return response.data;
};

/**
 * Get ML-powered personalized recommendations grouped into "Because You Liked X" sections.
 * Used on: Home page "Recommended For You", Recommendations page.
 */
export const getMLRecommendations = async (limit = 20) => {
  const response = await API.get('/recommend/ml/personalized', { params: { limit } });
  return response.data;
};

// ============================================================
// PROFILE API CALLS
// ============================================================

/**
 * Get full user profile with stats, genre distribution, recent ratings.
 * Used on: Profile page.
 */
export const getUserProfile = async () => {
  const response = await API.get('/profile');
  return response.data;
};

/**
 * Get just the activity stats (lighter endpoint).
 * Used on: Quick stats display.
 */
export const getProfileStats = async () => {
  const response = await API.get('/profile/stats');
  return response.data;
};

// ============================================================
// WATCHLIST API CALLS (Phase 5 — placeholders)
// ============================================================

export const getWatchlist = async () => {
  const response = await API.get('/watchlist');
  return response.data;
};

/**
 * Get just the movie IDs in watchlist (fast check).
 * Used on: App load — to know which movies show "✓ In Watchlist"
 */
export const getWatchlistIds = async () => {
  const response = await API.get('/watchlist/ids');
  return response.data;
};

/**
 * Add a movie to watchlist.
 * Used on: "Add to Watchlist" buttons everywhere
 */
export const addToWatchlist = async (movieId) => {
  const response = await API.post('/watchlist', { movie_id: movieId });
  return response.data;
};

/**
 * Remove a movie from watchlist.
 * Used on: Trash icon on Watchlist page, toggle off bookmark
 */
export const removeFromWatchlist = async (movieId) => {
  const response = await API.delete(`/watchlist/${movieId}`);
  return response.data;
};

/**
 * Mark a movie as watched (removes from watchlist, adds to history).
 * Used on: "Watched" button on Watchlist page
 */
export const markAsWatched = async (movieId) => {
  const response = await API.post('/watchlist/watched', { movie_id: movieId });
  return response.data;
};

/**
 * Get watch history.
 * Used on: Profile page stats
 */
export const getWatchHistory = async () => {
  const response = await API.get('/watchlist/history');
  return response.data;
};

// ============================================================
// RATING API CALLS
// ============================================================

/**
 * Rate a movie (1-5 stars). Creates or updates.
 * Used on: RatingStars component everywhere
 */
export const rateMovie = async (movieId, rating) => {
  const response = await API.post('/ratings', { movie_id: movieId, rating: rating });
  return response.data;
};

/**
 * Get all ratings with movie details.
 * Used on: Profile page "Recently Rated" section
 */
export const getUserRatings = async () => {
  const response = await API.get('/ratings');
  return response.data;
};

/**
 * Get just movie IDs + ratings (fast lookup).
 * Used on: App load — to show user's ratings on any MovieCard
 */
export const getUserRatingIds = async () => {
  const response = await API.get('/ratings/ids');
  return response.data;
};

/**
 * Get rating stats (total, average, highest, lowest).
 * Used on: Profile page Activity Overview
 */
export const getRatingStats = async () => {
  const response = await API.get('/ratings/stats');
  return response.data;
};

/**
 * Get user's rating for a specific movie.
 * Used on: MovieDetail page — show filled stars
 */
export const getMovieRating = async (movieId) => {
  const response = await API.get(`/ratings/${movieId}`);
  return response.data;
};

/**
 * Delete a rating.
 */
export const deleteRating = async (movieId) => {
  const response = await API.delete(`/ratings/${movieId}`);
  return response.data;
};
