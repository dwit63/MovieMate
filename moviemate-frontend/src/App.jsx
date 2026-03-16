import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
const OnboardingPage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Onboarding Page</div>;
const HomePage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Home Page</div>;
const ExplorePage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Explore Page</div>;
const MovieDetailPage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Movie Detail Page</div>;
const MoodPage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Mood Page</div>;
const RecommendationsPage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Recommendations Page</div>;
const WatchlistPage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Watchlist Page</div>;
const SearchResultsPage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Search Results Page</div>;
const ProfilePage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">Profile Page</div>;
const NotFoundPage = () => <div className="min-h-screen flex items-center justify-center text-white text-2xl">404 — Page Not Found</div>;

// Routes where Navbar and Footer should NOT appear
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
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A1A',
            color: '#ffffff',
            border: '1px solid #252525',
          },
        }}
      />
    </div>
  );
}
