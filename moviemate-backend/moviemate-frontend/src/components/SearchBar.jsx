import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { searchMovies } from '../services/api';

export default function SearchBar({ placeholder = 'Search movies...', compact = false }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchMovies(query);
        setSuggestions(data.results.slice(0, 6));
        setIsOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setIsOpen(false);
  };

  const handleSuggestionClick = (movie) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/movie/${movie.id}`);
  };

  return (
    <div ref={wrapperRef} className={`relative ${compact ? 'w-48 focus-within:w-64 transition-all' : 'w-full'}`}>
      <div className="flex items-center gap-2 bg-dark-secondary border border-dark-border rounded-full px-3 py-2 focus-within:border-accent/50 transition-colors">
        <Search size={15} className="text-gray-500 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-transparent text-white text-sm placeholder-gray-500 outline-none w-full"
        />
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}>
            <X size={14} className="text-gray-500 hover:text-white transition-colors" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-2xl z-50">
          {suggestions.map((movie) => (
            <button
              key={movie.id}
              onClick={() => handleSuggestionClick(movie)}
              className="flex items-center gap-3 w-full px-3 py-2 hover:bg-dark-hover transition-colors text-left"
            >
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-8 h-12 object-cover rounded flex-shrink-0"
                onError={(e) => { e.target.src = 'https://placehold.co/32x48/252525/ffffff?text=N/A'; }}
              />
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{movie.title}</p>
                <p className="text-gray-500 text-xs">{movie.year} · {movie.genres?.[0]}</p>
              </div>
            </button>
          ))}
          <button
            onClick={handleSearch}
            className="w-full px-3 py-2 text-center text-accent text-xs hover:bg-dark-hover transition-colors border-t border-dark-border"
          >
            See all results for "{query}"
          </button>
        </div>
      )}
    </div>
  );
}
