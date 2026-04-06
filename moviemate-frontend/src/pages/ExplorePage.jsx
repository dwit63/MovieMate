import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal, Star, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieGrid from '../components/MovieGrid';
import GenreTag from '../components/GenreTag';
import { discoverMovies, getGenres } from '../services/api';

const MIN_YEAR = 1970;
const MAX_YEAR = 2026;

const SORT_OPTIONS = [
  { value: 'popularity.desc',          label: 'Popularity' },
  { value: 'primary_release_date.desc', label: 'Newest Arrivals' },
  { value: 'vote_average.desc',         label: 'Rating: High to Low' },
  { value: 'title.asc',                 label: 'Title A–Z' },
];

const LANGUAGES = [
  { value: '',   label: 'All' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'ja', label: 'Japanese' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ filters, genres, onChange, onReset }) {
  const { sortBy, selectedGenres, minYear, minRating, language } = filters;

  const toggleGenre = (genreId) =>
    onChange(
      'selectedGenres',
      selectedGenres.includes(genreId)
        ? selectedGenres.filter((id) => id !== genreId)
        : [...selectedGenres, genreId]
    );

  const hasActiveFilters =
    selectedGenres.length > 0 || minRating > 0 || minYear > MIN_YEAR;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-accent hover:text-accent-hover flex items-center gap-1"
          >
            <X size={12} /> Reset
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onChange('sortBy', e.target.value)}
          className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Genres */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Genres</h3>
        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {genres.map((genre) => (
            <label key={genre.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedGenres.includes(genre.id)}
                onChange={() => toggleGenre(genre.id)}
                className="rounded border-dark-border bg-dark text-accent focus:ring-accent w-4 h-4 cursor-pointer"
              />
              <span
                className={`text-sm transition-colors ${
                  selectedGenres.includes(genre.id)
                    ? 'text-accent font-medium'
                    : 'text-gray-400 group-hover:text-white'
                }`}
              >
                {genre.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Release Year */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-white">Release Year</h3>
          <span className="text-xs text-accent font-mono">{minYear}+</span>
        </div>
        <input
          type="range"
          min={MIN_YEAR} max={MAX_YEAR}
          value={minYear}
          onChange={(e) => onChange('minYear', Number(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500 bg-dark-border"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{MIN_YEAR}</span><span>{MAX_YEAR}</span>
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-white">Minimum Rating</h3>
          <span className="text-xs text-accent font-mono">
            {filters.minRating > 0 ? `${filters.minRating}+` : 'Any'}
          </span>
        </div>
        <input
          type="range"
          min={0} max={10} step={0.5}
          value={minRating}
          onChange={(e) => onChange('minRating', Number(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500 bg-dark-border"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span><span>10</span>
        </div>
      </div>

      {/* Language */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">Language</h3>
        <select
          value={language}
          onChange={(e) => onChange('language', e.target.value)}
          className="w-full bg-dark border border-dark-border rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-accent outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ── List Row ─────────────────────────────────────────────────────────────────
function MovieListRow({ movie }) {
  const navigate = useNavigate();

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : `https://placehold.co/64x96/1a1a1a/fff?text=N/A`;

  const year = movie.release_date?.slice(0, 4) || '';
  const rating = movie.vote_average || 0;

  return (
    <div
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="flex gap-4 bg-dark-card border border-dark-border rounded-xl overflow-hidden cursor-pointer hover:border-accent/40 hover:bg-dark-hover transition-all group"
    >
      <img
        src={posterUrl}
        alt={movie.title}
        className="w-16 h-24 object-cover flex-shrink-0"
        onError={(e) => { e.target.src = `https://placehold.co/64x96/1a1a1a/fff?text=N/A`; }}
      />
      <div className="flex flex-col justify-center py-3 pr-4 gap-1.5 min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-sm truncate group-hover:text-accent transition-colors">
            {movie.title}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0">{year}</span>
        </div>
        <div className="flex items-center gap-1">
          <Star size={12} fill="#F59E0B" stroke="#F59E0B" />
          <span className="text-star text-xs font-bold">{rating.toFixed(1)}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {movie.genres?.slice(0, 2).map((g) => <GenreTag key={g} genre={g} size="xs" />)}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({
    sortBy: 'popularity.desc',
    selectedGenres: [],
    minYear: MIN_YEAR,
    minRating: 0,
    language: '',
  });

  // Fetch genres once on mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const data = await getGenres();
        setGenres(data.genres || []);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    fetchGenres();
  }, []);

  // Fetch movies whenever filters or page change
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setIsLoading(true);

        const params = {
          page,
          sort_by: filters.sortBy,
        };

        if (filters.selectedGenres.length > 0) {
          params.genres = filters.selectedGenres.join(',');
        }
        if (filters.minYear > MIN_YEAR) params.year_min = filters.minYear;
        if (filters.minRating > 0)      params.rating_min = filters.minRating;
        if (filters.language)            params.language = filters.language;

        const data = await discoverMovies(params);
        setMovies(data.movies || []);
        setTotalPages(data.total_pages || 1);
        setTotalResults(data.total_results || 0);

      } catch (error) {
        console.error('Error fetching movies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, [filters, page]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      sortBy: 'popularity.desc',
      selectedGenres: [],
      minYear: MIN_YEAR,
      minRating: 0,
      language: '',
    });
    setPage(1);
  };

  // Active genre names for the filter pills
  const activeGenreNames = genres
    .filter((g) => filters.selectedGenres.includes(g.id))
    .map((g) => ({ id: g.id, name: g.name }));

  const hasActiveFilters =
    filters.selectedGenres.length > 0 ||
    filters.minRating > 0 ||
    filters.minYear > MIN_YEAR;

  const pageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-1 min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 border-r border-dark-border bg-dark-secondary overflow-y-auto p-6 sticky top-16 h-[calc(100vh-4rem)]">
        <Sidebar
          filters={filters}
          genres={genres}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      </aside>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-dark border-r border-dark-border overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-white">Filters</span>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <Sidebar
              filters={filters}
              genres={genres}
              onChange={handleFilterChange}
              onReset={handleReset}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-6 md:p-8">
        {/* Header row */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible"
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Explore Movies</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Discovering{' '}
              <span className="text-accent font-semibold">
                {totalResults.toLocaleString()}
              </span>{' '}
              titles matching your criteria
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 border border-dark-border rounded-lg bg-dark-card text-gray-400 hover:text-white text-sm transition-colors"
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasActiveFilters && (
                <span className="bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {filters.selectedGenres.length +
                    (filters.minRating > 0 ? 1 : 0) +
                    (filters.minYear > MIN_YEAR ? 1 : 0)}
                </span>
              )}
            </button>
            {/* View toggle */}
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 border rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-dark-border bg-dark-card text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 border rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-dark-border bg-dark-card text-gray-400 hover:text-white'
              }`}
            >
              <List size={18} />
            </button>
          </div>
        </motion.div>

        {/* Active genre filter pills */}
        {activeGenreNames.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeGenreNames.map((g) => (
              <button
                key={g.id}
                onClick={() =>
                  handleFilterChange(
                    'selectedGenres',
                    filters.selectedGenres.filter((id) => id !== g.id)
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1 bg-accent/10 border border-accent/30 text-accent text-xs font-medium rounded-full hover:bg-accent/20 transition-colors"
              >
                {g.name} <X size={11} />
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-lg bg-dark-card animate-pulse" />
            ))}
          </div>
        )}

        {/* Movie Grid / List */}
        {!isLoading && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            {viewMode === 'grid' ? (
              <MovieGrid movies={movies} emptyMessage="No movies match your filters." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movies.length === 0 ? (
                  <p className="text-gray-500 py-12 col-span-2 text-center">
                    No movies match your filters.
                  </p>
                ) : (
                  movies.map((m) => <MovieListRow key={m.id} movie={m} />)
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-1 pb-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-dark-border bg-dark-card text-gray-400 hover:bg-accent/10 hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            {pageNumbers().map((p, i) =>
              p === '...' ? (
                <span
                  key={`ellipsis-${i}`}
                  className="w-10 h-10 flex items-center justify-center text-gray-500"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold text-sm transition-all ${
                    page === p
                      ? 'bg-accent text-white border border-accent'
                      : 'border border-dark-border bg-dark-card text-gray-400 hover:bg-accent/10 hover:text-accent'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-dark-border bg-dark-card text-gray-400 hover:bg-accent/10 hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}