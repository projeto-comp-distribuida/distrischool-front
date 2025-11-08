"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { notificationService } from '@/services/notification.service';
import { logger } from '@/lib/logger';
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
    logger.info('Auth Context', 'Carregando dados do usuário...');
    
    try {
      if (authService.isAuthenticated()) {
        logger.debug('Auth Context', 'Usuário autenticado, buscando dados...');
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        logger.success('Auth Context', '✅ Usuário carregado com sucesso', {
          userId: currentUser.id,
          email: currentUser.email,
          roles: currentUser.roles
        });
      } else {
        logger.info('Auth Context', 'Usuário não autenticado');
        // Not authenticated, clear any cached user
        setUser(null);
      }
    } catch (error) {
      logger.error('Auth Context', 'Erro ao carregar usuário', error);
      // Don't automatically logout on error - might be network issue
      // Keep the user logged in if the token is still valid
      if (!authService.isAuthenticated()) {
        logger.warn('Auth Context', 'Token inválido ou expirado, fazendo logout...');
        // Token is expired or invalid
        authService.logout();
        setUser(null);
      } else {
        logger.warn('Auth Context', 'Token válido mas erro ao buscar usuário, usando cache...');
        // Token is still valid, try to use cached user
        if (typeof window !== 'undefined') {
          const cachedUser = localStorage.getItem('currentUser');
          if (cachedUser) {
            try {
              const user = JSON.parse(cachedUser);
              setUser(user);
              logger.info('Auth Context', '✅ Usando dados do usuário em cache', {
                userId: user.id,
                email: user.email
              });
            } catch (e) {
              logger.error('Auth Context', 'Erro ao fazer parse do usuário em cache', e);
            }
          }
        }
      }
    } finally {
      setIsLoading(false);
      logger.debug('Auth Context', 'Carregamento do usuário finalizado');
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (credentials: LoginRequest) => {
    logger.info('Auth Context', '🔐 Iniciando processo de login...', {
      email: credentials.email
    });
    
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        logger.success('Auth Context', '✅ Login realizado com sucesso!', {
          userId: response.data.user.id,
          email: response.data.user.email,
          roles: response.data.user.roles,
          hasToken: !!response.data.token
        });
        
        setUser(response.data.user);
        
        // Store user in localStorage for persistence
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          logger.debug('Auth Context', 'Usuário salvo no localStorage');
        }

        // Conectar WebSocket para notificações se for admin
        if (response.data.user.roles?.includes('ADMIN') && response.data.token) {
          logger.info('Auth Context', 'Usuário é ADMIN, conectando WebSocket para notificações...');
          notificationService.connectWebSocket(response.data.token, (notification) => {
            logger.info('Auth Context', 'Nova notificação recebida via WebSocket no contexto');
          });
        }
      } else {
        const errorMsg = response.message || 'Login failed';
        logger.error('Auth Context', '❌ Login falhou', { message: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (error) {
      logger.error('Auth Context', '❌ Erro durante login', error);
      throw error;
    } finally {
      setIsLoading(false);
      logger.debug('Auth Context', 'Processo de login finalizado');
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    logger.info('Auth Context', '📝 Iniciando processo de registro...', {
      email: data.email,
      name: data.name
    });
    
    setIsLoading(true);
    try {
      const response = await authService.register(data);
      
      if (!response.success) {
        const errorMsg = response.message || 'Registration failed';
        logger.error('Auth Context', '❌ Registro falhou', { message: errorMsg });
        throw new Error(errorMsg);
      }
      
      logger.success('Auth Context', '✅ Registro realizado com sucesso!', {
        email: data.email
      });
      
      // Note: After registration, user may need to verify email
      // So we don't automatically log them in
    } catch (error) {
      logger.error('Auth Context', '❌ Erro durante registro', error);
      throw error;
    } finally {
      setIsLoading(false);
      logger.debug('Auth Context', 'Processo de registro finalizado');
    }
  }, []);

  const logout = useCallback(() => {
    logger.info('Auth Context', '🚪 Iniciando processo de logout...');
    
    // Desconectar WebSocket de notificações
    if (notificationService.isWebSocketConnected()) {
      logger.info('Auth Context', 'Desconectando WebSocket de notificações...');
      notificationService.disconnectWebSocket();
    }
    
    authService.logout();
    setUser(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      logger.debug('Auth Context', 'Dados do usuário removidos do localStorage');
    }
    
    logger.success('Auth Context', '✅ Logout realizado com sucesso!');
  }, []);

  const refreshUser = useCallback(async () => {
    logger.info('Auth Context', '🔄 Atualizando dados do usuário...');
    
    try {
      // Clear cached user to force fresh fetch
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentUser');
        logger.debug('Auth Context', '🗑️ Cache do usuário limpo');
      }
      
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      logger.success('Auth Context', '✅ Dados do usuário atualizados', {
        userId: currentUser.id,
        email: currentUser.email
      });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        logger.debug('Auth Context', 'Novos dados do usuário salvos no localStorage');
      }
    } catch (error) {
      logger.error('Auth Context', '❌ Erro ao atualizar dados do usuário', error);
      logout();
    }
  }, [logout]);

  // Refresh user data when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && authService.isAuthenticated()) {
        logger.info('Auth Context', '🔄 Página visível - atualizando dados do usuário');
        refreshUser();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    logger.debug('Auth Context', 'Listener de visibilidade da página registrado');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      logger.debug('Auth Context', 'Listener de visibilidade da página removido');
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


