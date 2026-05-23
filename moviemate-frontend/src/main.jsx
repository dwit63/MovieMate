import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { WatchlistProvider } from './context/WatchlistContext';
import App from './App';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WatchlistProvider>
          <App />
          {/* Single Toaster here — removed from App.jsx */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1A1A1A',
                color: '#ffffff',
                border: '1px solid #252525',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                maxWidth: '360px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#1A1A1A' },
                style: {
                  background: '#1A1A1A',
                  color: '#ffffff',
                  border: '1px solid #22c55e33',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  maxWidth: '360px',
                },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#1A1A1A' },
                style: {
                  background: '#1A1A1A',
                  color: '#ffffff',
                  border: '1px solid #ef444433',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  fontSize: '14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                  maxWidth: '360px',
                },
              },
            }}
          />
        </WatchlistProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {app}
    </GoogleOAuthProvider>
  ) : app
);
