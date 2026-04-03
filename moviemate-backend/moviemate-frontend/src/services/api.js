import axios from 'axios';
import {
  mockMovies,
  mockTrendingMovies,
  mockRecommendations,
  mockWatchlist,
  mockRatings,
  mockUserProfile,
} from '../data/mockData';
import { API_BASE_URL } from '../utils/constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('moviemate_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

export const getMovies = async (page = 1) => {
  await delay();
  return { results: mockMovies, totalPages: 3, page };
};

export const getTrendingMovies = async () => {
  await delay();
  return { results: mockTrendingMovies };
};

export const getTopRatedMovies = async () => {
  await delay();
  return { results: [...mockMovies].sort((a, b) => b.rating - a.rating).slice(0, 10) };
};

export const searchMovies = async (query) => {
  await delay(200);
  const q = query.toLowerCase();
  const results = mockMovies.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.genres.some((g) => g.toLowerCase().includes(q))
  );
  return { results, query };
};

export const getMovieById = async (id) => {
  await delay();
  const movie = mockMovies.find((m) => m.id === Number(id));
  if (!movie) throw new Error('Movie not found');
  return movie;
};

export const getRecommendations = async () => {
  await delay();
  return { results: mockRecommendations };
};

export const getSimilarMovies = async (movieId) => {
  await delay();
  const movie = mockMovies.find((m) => m.id === Number(movieId));
  if (!movie) return { results: [] };
  const similar = mockMovies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 8);
  return { results: similar };
};

export const getMoodMovies = async (mood) => {
  await delay();
  return { results: mockMovies.slice(0, 12), mood };
};

export const getHiddenGems = async () => {
  await delay();
  const gems = mockMovies.filter((m) => m.rating >= 7.5 && m.year < 2020).slice(0, 8);
  return { results: gems };
};

export const getWatchlist = async () => {
  await delay();
  return { results: mockWatchlist };
};

export const addToWatchlist = async (movieId) => {
  await delay(200);
  return { success: true, movieId };
};

export const removeFromWatchlist = async (movieId) => {
  await delay(200);
  return { success: true, movieId };
};

export const rateMovie = async (movieId, rating) => {
  await delay(200);
  return { success: true, movieId, rating };
};

export const getUserRatings = async () => {
  await delay();
  return { results: mockRatings };
};

export const getUserProfile = async () => {
  await delay();
  return mockUserProfile;
};

export const updateProfile = async (data) => {
  await delay(400);
  return { ...mockUserProfile, ...data };
};

export default apiClient;
