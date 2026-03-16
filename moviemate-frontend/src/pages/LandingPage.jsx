import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Film,
  Smile,
  Sparkles,
  Bookmark,
  Brain,
  MessageSquare,
  Zap,
} from 'lucide-react';

// ─── Animation Variant ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-dark-border bg-dark/80 backdrop-blur-md px-6 py-4 md:px-20 lg:px-40">
      <div className="flex items-center gap-2">
        <Film className="text-white w-7 h-7" />
        <span className="text-white text-xl font-bold tracking-tight">MovieMate</span>
      </div>
      <div className="flex gap-4 items-center">
        <Link
          to="/login"
          className="text-gray-300 text-sm font-bold hover:text-white transition-colors"
        >
          Log In
        </Link>
        <Link
          to="/signup"
          className="bg-dark-hover hover:bg-zinc-700 text-white text-sm font-bold py-2 px-5 rounded-lg transition-all"
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center text-center px-6 py-20 md:py-32 gap-8 max-w-4xl mx-auto"
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-white text-5xl md:text-7xl font-black leading-tight tracking-tighter">
          Stop Scrolling. <br />
          <span className="text-gray-400">Start Watching.</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-normal leading-relaxed">
          Our AI cures streaming choice overload by finding the perfect movie for you.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <Link
          to="/signup"
          className="bg-white text-dark text-base font-bold py-4 px-10 rounded-xl hover:opacity-90 transition-all"
        >
          Get Started
        </Link>
        <Link
          to="/explore"
          className="bg-dark-card border border-dark-border text-white text-base font-bold py-4 px-10 rounded-xl hover:bg-dark-hover transition-all"
        >
          Explore Movies
        </Link>
      </div>
    </motion.section>
  );
}

const HOW_IT_WORKS = [
  {
    step: 'Step 1',
    title: 'Tell us your mood',
    desc: 'Pick a genre or simply describe how you want to feel right now.',
    Icon: Smile,
  },
  {
    step: 'Step 2',
    title: 'AI Analysis',
    desc: 'Our proprietary AI analyzes 10,000+ movies to find your match.',
    Icon: Brain,
  },
  {
    step: 'Step 3',
    title: 'Perfect Picks',
    desc: 'Get personalized recommendations with clear explanations.',
    Icon: Sparkles,
  },
];

function HowItWorksSection() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="px-6 py-20 md:px-20 lg:px-40 bg-dark"
    >
      <div className="max-w-[960px] mx-auto">
        <h2 className="text-white text-3xl font-bold mb-12 text-center md:text-left">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ step, title, desc, Icon }) => (
            <div
              key={step}
              className="bg-dark-card border border-dark-border p-8 rounded-2xl flex flex-col gap-4"
            >
              <div className="bg-dark-hover w-12 h-12 rounded-lg flex items-center justify-center">
                <Icon className="text-gray-300 w-5 h-5" />
              </div>
              <div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">
                  {step}
                </p>
                <h3 className="text-white text-lg font-bold">{title}</h3>
                <p className="text-gray-400 text-sm mt-2">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

const FEATURES = [
  {
    title: 'Mood-Based Discovery',
    desc: 'Find movies that match your current emotional state, not just a category.',
    Icon: Smile,
  },
  {
    title: 'Smart Recommendations',
    desc: 'AI-driven suggestions that learn from your feedback over time.',
    Icon: Zap,
  },
  {
    title: 'Watchlist',
    desc: 'Easily track and organize everything you want to watch in one place.',
    Icon: Bookmark,
  },
  {
    title: 'Transparent Explanations',
    desc: 'Understand exactly why we recommended each film based on your profile.',
    Icon: MessageSquare,
  },
];

function FeaturesSection() {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="px-6 py-20 md:px-20 lg:px-40 bg-dark border-t border-dark-border"
    >
      <div className="max-w-[960px] mx-auto">
        <div className="flex flex-col gap-4 mb-12">
          <h2 className="text-white text-3xl font-bold tracking-tight">Features Highlight</h2>
          <p className="text-gray-400 text-base max-w-xl">
            Designed to help you find your next favorite film instantly without the endless
            scrolling.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(({ title, desc, Icon }) => (
            <div
              key={title}
              className="flex items-start gap-5 p-6 rounded-2xl border border-dark-border bg-dark-card/50"
            >
              <Icon className="text-white w-7 h-7 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <h3 className="text-white text-lg font-bold">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function LandingFooter() {
  return (
    <motion.footer
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="border-t border-dark-border px-6 py-12 md:px-20 lg:px-40 bg-dark"
    >
      <div className="max-w-[960px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Film className="text-gray-300 w-6 h-6" />
            <span className="text-white text-lg font-bold">MovieMate</span>
          </div>
          <p className="text-gray-500 text-xs">© 2024 MovieMate Team. All rights reserved.</p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col gap-2">
            <p className="text-white text-sm font-bold">Product</p>
            <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
              Features
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
              API
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-white text-sm font-bold">Company</p>
            <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
              About
            </a>
            <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors">
              Privacy
            </a>
          </div>
        </div>

        {/* TMDB badge */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-dark-card px-3 py-1.5 border border-dark-border rounded">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
              Powered by
            </span>
            <span className="text-white text-xs font-black tracking-tight">TMDB</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-dark text-gray-200">
      <LandingNav />
      <main className="flex flex-col flex-1">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
      </main>
      <LandingFooter />
    </div>
  );
}
