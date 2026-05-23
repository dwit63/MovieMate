import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const pages = {
  '/privacy-policy': {
    title: 'Privacy Policy',
    updated: 'Last updated: May 23, 2026',
    intro: 'MovieMate uses account, rating, watchlist, and preference data to personalize your movie experience.',
    sections: [
      {
        heading: 'Information We Use',
        body: 'MovieMate stores the information you provide during account creation, onboarding, ratings, watchlist activity, and watched history.',
      },
      {
        heading: 'How Data Improves Recommendations',
        body: 'Ratings, genre preferences, and watch activity are used to calculate profile stats and personalize movie suggestions.',
      },
      {
        heading: 'Your Control',
        body: 'You can update your profile, manage ratings and watchlist items, and delete your account data through the app features provided.',
      },
    ],
  },
  '/terms-of-service': {
    title: 'Terms of Service',
    updated: 'Last updated: May 23, 2026',
    intro: 'These terms describe the expected use of MovieMate as a personal movie discovery and tracking project.',
    sections: [
      {
        heading: 'Using MovieMate',
        body: 'MovieMate is intended for personal movie discovery, ratings, watchlists, and recommendations.',
      },
      {
        heading: 'Movie Data',
        body: 'Movie information may come from third-party providers such as TMDB. MovieMate does not claim ownership over third-party movie metadata, images, or trademarks.',
      },
      {
        heading: 'Availability',
        body: 'MovieMate is a project application and may change over time as features are improved.',
      },
    ],
  },
  '/cookie-policy': {
    title: 'Cookie Policy',
    updated: 'Last updated: May 23, 2026',
    intro: 'MovieMate keeps browser storage simple and focused on authentication and app experience.',
    sections: [
      {
        heading: 'Authentication Storage',
        body: 'MovieMate stores your login token in browser local storage so you can stay signed in while using the app.',
      },
      {
        heading: 'Preferences And Session Data',
        body: 'The frontend may use browser storage for app state needed to keep the experience consistent between page refreshes.',
      },
      {
        heading: 'Third-Party Services',
        body: 'Google Sign-In and TMDB-powered features may use their own service behavior. Review their policies for details about their platforms.',
      },
    ],
  },
};

export default function LegalPage() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const page = pages[pathname] || pages['/privacy-policy'];

  return (
    <div className="w-full min-h-screen">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-12">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
            <ShieldCheck size={24} className="text-accent" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">{page.updated}</p>
          <h1 className="text-4xl font-black text-white mt-2">{page.title}</h1>
          <p className="text-gray-400 mt-4 leading-relaxed max-w-2xl">{page.intro}</p>
        </div>

        <div className="space-y-4">
          {page.sections.map((section) => (
            <section key={section.heading} className="bg-dark-card border border-dark-border rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-2">{section.heading}</h2>
              <p className="text-gray-400 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8">
          <Link
            to={isAuthenticated ? '/home' : '/'}
            className="inline-flex px-5 py-2.5 bg-dark-card border border-dark-border text-gray-300 hover:text-white hover:border-gray-600 rounded-xl text-sm font-bold transition-colors"
          >
            Back to MovieMate
          </Link>
        </div>
      </main>
    </div>
  );
}
