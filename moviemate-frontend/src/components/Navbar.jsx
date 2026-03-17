import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Film, Bell, LogOut, User, Compass, Smile, Bookmark, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
      <div className="p-1.5 bg-accent rounded-lg">
        <Film size={18} className="text-white" />
      </div>
      <span className="text-white font-bold text-lg tracking-tight">MovieMate</span>
    </Link>
  );
}

const navLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
    isActive ? 'text-white bg-dark-hover' : 'text-gray-400 hover:text-white hover:bg-dark-hover'
  }`;

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-40 bg-dark/80 backdrop-blur-md border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Logo />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-dark-hover transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-40 bg-dark-secondary/95 backdrop-blur-md border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-6">
          <Logo />
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/explore" className={navLinkClass}>
              <Compass size={16} />
              Explore
            </NavLink>
            <NavLink to="/mood" className={navLinkClass}>
              <Smile size={16} />
              Mood
            </NavLink>
            <NavLink to="/watchlist" className={navLinkClass}>
              <Bookmark size={16} />
              Watchlist
            </NavLink>
          </div>
        </div>

        <div className="flex-1 max-w-sm hidden sm:block">
          <SearchBar compact />
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-dark-hover transition-colors text-gray-400 hover:text-white relative">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-dark-hover transition-colors">
              <img
                src={user?.avatar}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-dark-border"
                onError={(e) => { e.target.src = 'https://placehold.co/32x32/252525/ffffff?text=U'; }}
              />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all">
              <div className="px-4 py-3 border-b border-dark-border">
                <p className="text-white font-medium text-sm truncate">{user?.name}</p>
                <p className="text-gray-500 text-xs truncate">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-dark-hover transition-colors text-sm"
              >
                <User size={15} />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-red-400 hover:bg-dark-hover transition-colors text-sm w-full"
              >
                <LogOut size={15} />
                Log Out
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-full hover:bg-dark-hover transition-colors text-gray-400 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-dark-border bg-dark-secondary/98 px-4 py-3 flex flex-col gap-1">
          <NavLink to="/explore" className={navLinkClass} onClick={closeMobile}>
            <Compass size={16} />
            Explore
          </NavLink>
          <NavLink to="/mood" className={navLinkClass} onClick={closeMobile}>
            <Smile size={16} />
            Mood
          </NavLink>
          <NavLink to="/watchlist" className={navLinkClass} onClick={closeMobile}>
            <Bookmark size={16} />
            Watchlist
          </NavLink>
          <div className="mt-2 pt-2 border-t border-dark-border">
            <SearchBar />
          </div>
        </div>
      )}
    </nav>
  );
}
