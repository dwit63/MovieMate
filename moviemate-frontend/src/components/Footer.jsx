import { Link } from 'react-router-dom';
import { Film } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const soon = (label) => () => toast(`${label} — coming soon!`);

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-accent rounded-lg">
        <Film size={16} className="text-white" />
      </div>
      <span className="text-white font-bold text-base tracking-tight">MovieMate</span>
    </div>
  );
}

export default function Footer() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <footer className="border-t border-dark-border bg-dark-secondary mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-6">
            <button onClick={soon('Privacy Policy')} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Privacy Policy</button>
            <button onClick={soon('Terms of Service')} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Terms of Service</button>
            <button onClick={soon('Cookie Policy')} className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Cookie Policy</button>
          </div>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} MovieMate. All rights reserved.</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-dark-border bg-dark-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          <div className="flex flex-col gap-3">
            <Logo />
            <p className="text-gray-500 text-sm max-w-xs">
              Personalized movie recommendations powered by AI and your taste.
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-600 text-xs font-medium uppercase tracking-wider">Powered by</span>
              <span className="bg-dark-card border border-dark-border text-xs text-gray-400 px-2 py-1 rounded font-mono">TMDB</span>
            </div>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-2">
              <p className="text-white text-sm font-semibold mb-1">Product</p>
              <Link to="/explore" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Explore</Link>
              <Link to="/mood" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Mood Match</Link>
              <Link to="/recommendations" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Recommendations</Link>
              <Link to="/watchlist" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Watchlist</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-white text-sm font-semibold mb-1">Company</p>
              <button onClick={soon('About')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors text-left">About</button>
              <button onClick={soon('Privacy Policy')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors text-left">Privacy Policy</button>
              <button onClick={soon('Terms of Service')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors text-left">Terms of Service</button>
              <button onClick={soon('Contact')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors text-left">Contact</button>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-dark-border">
          <p className="text-gray-600 text-xs text-center">© {new Date().getFullYear()} MovieMate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
