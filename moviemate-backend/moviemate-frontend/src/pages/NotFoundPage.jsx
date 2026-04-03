import { Link } from 'react-router-dom';
import { Film, Home, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-dark">

      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 md:px-10 py-4 shrink-0">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Film size={26} className="text-accent" />
          <span className="text-xl font-bold text-white tracking-tight">MovieMate</span>
        </Link>
        <Link
          to={isAuthenticated ? '/profile' : '/login'}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white"
          aria-label="Account"
        >
          <User size={18} />
        </Link>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="max-w-2xl w-full flex flex-col items-center">

          {/* Glow icon */}
          <div className="relative mb-8">
            {/* Glow blob */}
            <div className="absolute -inset-8 bg-accent/20 blur-3xl rounded-full pointer-events-none" />

            {/* Circle */}
            <motion.div
              animate={{ scale: [1, 1.04, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex items-center justify-center w-48 h-48 md:w-64 md:h-64 rounded-full bg-white/5 border border-white/10"
            >
              <Film size={110} className="text-accent opacity-80 md:hidden" />
              <Film size={140} className="text-accent opacity-80 hidden md:block" />
            </motion.div>
          </div>

          {/* 404 */}
          <h1 className="text-8xl md:text-[120px] font-black tracking-tighter text-white mb-2 leading-none">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            This scene doesn't exist in our script
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-md mb-10 leading-relaxed">
            It looks like you've wandered onto a deleted scene or a broken reel.
            Let's get you back to the main feature.
          </p>

          {/* CTA */}
          <Link
            to={isAuthenticated ? '/home' : '/'}
            className="group inline-flex items-center justify-center gap-2 bg-white text-black px-10 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-transform shadow-xl shadow-white/5"
          >
            <Home size={20} />
            Go Home
          </Link>
        </div>
      </main>

      {/* Footer glow strip */}
      <div className="w-full h-32 relative overflow-hidden pointer-events-none opacity-20 shrink-0">
        <div className="absolute inset-0 flex items-end justify-center">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/20 blur-[120px] rounded-full" />
      </div>

    </div>
  );
}
