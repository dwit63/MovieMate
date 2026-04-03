/**
 * src/services/api.js — API Service
 *
 * This file handles ALL communication between the frontend and backend.
 *
 * HOW IT WORKS:
 * 1. We create an "axios instance" with the backend URL (http://localhost:8000)
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
  baseURL: 'http://localhost:8000/api',  // Our FastAPI backend
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
      localStorage.removeItem('moviemate_token');
      // Optionally redirect to login
      // window.location.href = '/login';
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

// ============================================================
// MOVIE API CALLS (Phase 3 — placeholders for now)
// ============================================================

export const getMovies = async () => {
  // Will be implemented in Phase 3
  return [];
};

export const getTrendingMovies = async () => {
  return [];
};

export const getTopRatedMovies = async () => {
  return [];
};

export const searchMovies = async (query) => {
  return [];
};

export const getMovieById = async (id) => {
  return null;
};

// ============================================================
// RECOMMENDATION API CALLS (Phase 4 — placeholders)
// ============================================================

export const getRecommendations = async () => {
  return [];
};

export const getSimilarMovies = async (movieId) => {
  return [];
};

export const getMoodMovies = async (mood) => {
  return [];
};

export const getHiddenGems = async () => {
  return [];
};

// ============================================================
// WATCHLIST API CALLS (Phase 5 — placeholders)
// ============================================================

export const getWatchlist = async () => {
  return [];
};

export const addToWatchlist = async (movieId) => {
  return {};
};

export const removeFromWatchlist = async (movieId) => {
  return {};
};

// ============================================================
// RATING API CALLS (Phase 5 — placeholders)
// ============================================================

export const rateMovie = async (movieId, rating) => {
  return {};
};

export const getUserRatings = async () => {
  return [];
};

// Export the axios instance if needed elsewhere
export default API;