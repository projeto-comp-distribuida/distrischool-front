"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import type { User, LoginRequest, RegisterRequest } from '@/types/auth.types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount - always fresh from API
  const loadUser = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } else {
        // Not authenticated, clear any cached user
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // Don't automatically logout on error - might be network issue
      // Keep the user logged in if the token is still valid
      if (!authService.isAuthenticated()) {
        // Token is expired or invalid
        authService.logout();
        setUser(null);
      } else {
        // Token is still valid, try to use cached user
        if (typeof window !== 'undefined') {
          const cachedUser = localStorage.getItem('currentUser');
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              setUser(user);
              console.log('Using cached user data due to API error');
            } catch (e) {
              console.error('Failed to parse cached user:', e);
            }
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        
        // Store user in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }
      
      // Note: After registration, user may need to verify email
      // So we don't automatically log them in
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // Clear cached user to force fresh fetch
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
        console.log('🗑️ Cleared cached user data');
      }
      
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    }
  }, [logout]);

  // Refresh user data when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && authService.isAuthenticated()) {
        console.log('🔄 Page visible - refreshing user data');
        refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && authService.isAuthenticated(),
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}


