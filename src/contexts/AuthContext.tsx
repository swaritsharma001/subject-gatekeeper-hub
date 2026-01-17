import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthKey } from '@/services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_EXPIRY_KEY = 'auth_expiry';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedExpiry = localStorage.getItem(AUTH_EXPIRY_KEY);
    
    if (savedToken && savedExpiry) {
      const expiryDate = new Date(savedExpiry);
      if (expiryDate > new Date()) {
        setToken(savedToken);
        setIsAuthenticated(true);
      } else {
        // Token expired, clear it
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_EXPIRY_KEY);
      }
    }
  }, []);

  const login = async (key: string): Promise<boolean> => {
    try {
      const response = await useAuthKey(key);
      localStorage.setItem(AUTH_TOKEN_KEY, response.token);
      localStorage.setItem(AUTH_EXPIRY_KEY, response.expiresAt);
      setToken(response.token);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRY_KEY);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
