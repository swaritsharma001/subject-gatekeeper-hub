import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  authKey: string | null;
  login: (key: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_AUTH_KEY = 'abcdef123';
const AUTH_COOKIE_NAME = 'subject_topper_auth';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing auth key in localStorage
    const savedKey = localStorage.getItem(AUTH_COOKIE_NAME);
    if (savedKey === VALID_AUTH_KEY) {
      setAuthKey(savedKey);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (key: string): boolean => {
    if (key === VALID_AUTH_KEY) {
      localStorage.setItem(AUTH_COOKIE_NAME, key);
      setAuthKey(key);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(AUTH_COOKIE_NAME);
    setAuthKey(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, authKey, login, logout }}>
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
