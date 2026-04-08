import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import MovieDetailPage from './pages/MovieDetailPage';
import MoodPage from './pages/MoodPage';
import RecommendationsPage from './pages/RecommendationsPage';
import WatchlistPage from './pages/WatchlistPage';
import SearchResultsPage from './pages/SearchResultsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

const NO_CHROME_ROUTES = ['/', '/login', '/signup', '/onboarding'];

export default function App() {
  const { pathname } = useLocation();

  const is404 = ![
    '/', '/login', '/signup', '/onboarding',
    '/home', '/explore', '/mood', '/watchlist',
    '/recommendations', '/search', '/profile',
  ].some((r) => pathname === r || pathname.startsWith('/movie/'));

  const showChrome = !NO_CHROME_ROUTES.includes(pathname) && !is404;

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <ScrollToTop />
      {showChrome && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/movie/:id" element={<MovieDetailPage />} />
          <Route path="/mood" element={<MoodPage />} />
          <Route path="/recommendations" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showChrome && <Footer />}
    </div>
  );
}