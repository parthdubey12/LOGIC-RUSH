import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserProfile } from '../types';
import { api } from '../services/api';
import { setSocketAuthToken } from '../services/socket';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isHost: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<any>;
  register: (userData: any) => Promise<any>;
  guestLogin: () => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('logicrush_token');
    if (!token) {
      setSocketAuthToken(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setSocketAuthToken(token);
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        setProfile(data.user.profile || null);
      } else {
        localStorage.removeItem('logicrush_token');
        setSocketAuthToken(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.warn('Auth token verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.login(credentials);
    if (res.token && res.user) {
      localStorage.setItem('logicrush_token', res.token);
      setSocketAuthToken(res.token);
      setUser(res.user);
      setProfile(res.user.profile);
    }
    return res;
  };

  const register = async (userData: any) => {
    const res = await api.register(userData);
    if (res.token && res.user) {
      localStorage.setItem('logicrush_token', res.token);
      setSocketAuthToken(res.token);
      setUser(res.user);
      setProfile(res.user.profile);
    }
    return res;
  };

  const guestLogin = async () => {
    const res = await api.guestLogin();
    if (res.token && res.user) {
      localStorage.setItem('logicrush_token', res.token);
      setSocketAuthToken(res.token);
      setUser(res.user);
      setProfile(res.user.profile);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('logicrush_token');
    setSocketAuthToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    if (profile) {
      setProfile({ ...profile, ...newProfile });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isHost: user?.role === 'host' || user?.role === 'admin',
        isAdmin: user?.role === 'admin',
        isGuest: !!user?.isGuest,
        isLoading,
        login,
        register,
        guestLogin,
        logout,
        refreshUser,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
