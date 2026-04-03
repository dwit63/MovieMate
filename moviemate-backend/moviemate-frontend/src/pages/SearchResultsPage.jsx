import { useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SearchX, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import MovieGrid from '../components/MovieGrid';
import { mockMovies } from '../data/mockData';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const results = useMemo(() => {
    if (!query.trim()) return [...mockMovies];
    const q = query.toLowerCase();
    return mockMovies.filter((m) => m.title.toLowerCase().includes(q));
  }, [query]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <div className="w-full min-h-screen">
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">

        {/* Header */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Search size={20} className="text-gray-500 shrink-0" />
            <h1 className="text-2xl font-bold text-white">Search Results</h1>
          </div>
          {hasQuery && (
            <p className="text-gray-400 text-base mt-1 ml-8">
              Showing results for{' '}
              <span className="text-white font-semibold">"{query}"</span>
            </p>
          )}
          {!hasQuery && (
            <p className="text-gray-400 text-base mt-1 ml-8">Browse our full collection</p>
          )}
          <p className="text-gray-500 text-sm mt-2 ml-8">
            Found{' '}
            <span className="text-gray-300 font-medium">{results.length}</span>{' '}
            movie{results.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Results */}
        {hasResults && (
          <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <MovieGrid movies={results} />
          </motion.div>
        )}

        {/* No Results */}
        {!hasResults && hasQuery && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center justify-center py-28 gap-5 text-center"
          >
            <SearchX size={64} className="text-gray-600" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                No results found for{' '}
                <span className="text-gray-400">"{query}"</span>
              </h2>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm leading-relaxed">
                Try searching for something else or browse our collection.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Link
                to="/explore"
                className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white font-bold text-sm rounded-xl transition-all active:scale-95"
              >
                Browse Movies
              </Link>
              <Link
                to="/mood"
                className="px-6 py-2.5 bg-dark-card border border-dark-border text-white font-bold text-sm rounded-xl hover:bg-dark-hover transition-all active:scale-95"
              >
                Try Mood Search
              </Link>
            </div>
          </motion.div>
        )}

      </main>
    </div>
  );
}
