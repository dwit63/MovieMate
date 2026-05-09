/**
 * src/context/AuthContext.jsx — Authentication Context
 *
 * WHAT IS CONTEXT?
 * React Context is like a "global variable" for your app.
 * Instead of passing user data through every component as props,
 * any component can access the user data directly.
 *
 * HOW IT WORKS:
 * 1. AuthProvider wraps the entire app (in main.jsx)
 * 2. Any component can call useAuth() to get user data and auth functions
 * 3. When user logs in/out, ALL components that use useAuth() update automatically
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, signupUser, getCurrentUser } from '../services/api';
import toast from 'react-hot-toast';

// Create the context (like creating a global container)
const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the app and provides auth state to all components.
 *
 * STATE:
 * - user: the logged-in user object (or null if not logged in)
 * - token: the JWT token string (or null)
 * - isLoading: true while checking if user is logged in on app load
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('moviemate_token'));
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On app load, check if there's a stored token and if it's still valid.
   *
   * WHY?
   * When the user refreshes the page, React state is lost. But the token
   * is in localStorage (which survives page refreshes). So we check the
   * token with the backend to restore the user session.
   */
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('moviemate_token');
      if (storedToken) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setToken(storedToken);
        } catch {
          // Token is invalid or expired — clear everything and the
          // response interceptor in api.js will redirect to /login
          localStorage.removeItem('moviemate_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Login function — called from the LoginPage component.
   */
  const login = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      // data = { token: "...", user: {...}, message: "..." }

      // Store the token in localStorage (survives page refresh)
      localStorage.setItem('moviemate_token', data.token);

      // Update state
      setToken(data.token);
      setUser(data.user);

      toast.success(data.message || 'Logged in successfully!');

      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Signup function — called from the SignupPage component.
   */
  const signup = async (name, email, password) => {
    try {
      const data = await signupUser(name, email, password);

      localStorage.setItem('moviemate_token', data.token);
      setToken(data.token);
      setUser(data.user);

      toast.success(data.message || 'Account created successfully!');

      return { success: true, user: data.user };
    } catch (error) {
      const message = error.response?.data?.detail || 'Signup failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  /**
   * Logout function — clears everything.
   */
  const logout = () => {
    localStorage.removeItem('moviemate_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully.');
  };

  /**
   * Update user data in context (after profile update, onboarding, etc.)
   */
  const updateUser = (updatedUserData) => {
    setUser(prev => ({ ...prev, ...updatedUserData }));
  };

  // The value object — everything that components can access via useAuth()
  const value = {
    user,
    token,
    isAuthenticated: !!user,     // true if user is not null
    isLoading,
    login,
    signup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook — makes it easy to access auth data in any component.
 *
 * Usage:
 *   const { user, login, logout, isAuthenticated } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;