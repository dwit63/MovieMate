import { createContext, useContext, useState, useEffect } from 'react';
import { mockUserProfile } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('moviemate_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('moviemate_token');
    const storedUser = localStorage.getItem('moviemate_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const mockToken = 'mock_jwt_token_' + Date.now();
    const userData = { ...mockUserProfile, email };
    setToken(mockToken);
    setUser(userData);
    localStorage.setItem('moviemate_token', mockToken);
    localStorage.setItem('moviemate_user', JSON.stringify(userData));
    setIsLoading(false);
    return { success: true, user: userData };
  };

  const signup = async (name, email, password) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const mockToken = 'mock_jwt_token_' + Date.now();
    const userData = { ...mockUserProfile, name, email, isOnboarded: false };
    setToken(mockToken);
    setUser(userData);
    localStorage.setItem('moviemate_token', mockToken);
    localStorage.setItem('moviemate_user', JSON.stringify(userData));
    setIsLoading(false);
    return { success: true, user: userData };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('moviemate_token');
    localStorage.removeItem('moviemate_user');
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('moviemate_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        updateUser,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
