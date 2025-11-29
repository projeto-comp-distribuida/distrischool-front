"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';
import { notificationService } from '@/services/notification.service';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type { User, LoginRequest } from '@/types/auth.types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: (reason?: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const forcedLogoutRef = useRef(false);

  const logout = useCallback((reason?: string) => {
    const isForced = Boolean(reason);
    forcedLogoutRef.current = isForced;
    logger.info('Auth Context', '🚪 Iniciando processo de logout...', { reason });

    // Desconectar WebSocket de notificações
    if (notificationService.isWebSocketConnected()) {
      logger.info('Auth Context', 'Desconectando WebSocket de notificações...');
      notificationService.disconnectWebSocket();
    }

    authService.logout();
    setUser(null);

    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('currentUser');
        window.localStorage.removeItem('currentUser');
        logger.debug('Auth Context', 'Dados do usuário removidos do cache local');
      } catch (error) {
        logger.error('Auth Context', 'Erro ao remover usuário do cache', error);
      }
    }

    if (reason) {
      toast.warning(reason);
      logger.warn('Auth Context', 'Logout realizado com motivo', { reason });
    } else {
      toast.success('Você saiu da sua conta com segurança.');
      logger.success('Auth Context', '✅ Logout realizado com sucesso!');
    }
  }, []);

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
        if (!forcedLogoutRef.current) {
          logout('Sua sessão expirou. Faça login novamente.');
        }
      } else {
        logger.warn('Auth Context', 'Token válido mas erro ao buscar usuário, usando cache...');
        // Token is still valid, try to use cached user
        if (typeof window !== 'undefined') {
          try {
            const cachedUser = window.sessionStorage.getItem('currentUser');
            if (cachedUser) {
              const cachedParsed = JSON.parse(cachedUser);
              setUser(cachedParsed);
              toast.info('Não foi possível atualizar suas informações. Exibindo dados em cache.', {
                description: 'Verifique sua conexão e tente novamente.',
              });
              logger.info('Auth Context', '✅ Usando dados do usuário em cache', {
                userId: cachedParsed.id,
                email: cachedParsed.email
              });
            }
          } catch (cacheError) {
            logger.error('Auth Context', 'Erro ao fazer parse do usuário em cache', cacheError);
          }
        }
      }
    } finally {
      setIsLoading(false);
      logger.debug('Auth Context', 'Carregamento do usuário finalizado');
    }
  }, [logout]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const unsubscribe = apiClient.onUnauthorized(() => {
      logger.warn('Auth Context', 'Notificação de token inválido recebida via API Client');
      if (!forcedLogoutRef.current) {
        logout('Sua sessão expirou. Faça login novamente.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [logout]);

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
        forcedLogoutRef.current = false;
        
        // Store user in sessionStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem('currentUser', JSON.stringify(response.data.user));
            window.localStorage.removeItem('currentUser');
            logger.debug('Auth Context', 'Usuário salvo no sessionStorage');
          } catch (error) {
            logger.error('Auth Context', 'Erro ao salvar usuário no sessionStorage', error);
          }
        }

        // Conectar WebSocket para notificações se for admin
        if (response.data.user.roles?.includes('ADMIN') && response.data.token) {
          logger.info('Auth Context', 'Usuário é ADMIN, conectando WebSocket para notificações...');
          notificationService.connectWebSocket(response.data.token, (notification) => {
            logger.info('Auth Context', 'Nova notificação recebida via WebSocket no contexto');
          });
        }

        const displayName = response.data.user.firstName || response.data.user.email;
        toast.success(`Bem-vindo de volta, ${displayName}!`, {
          description: 'Você foi autenticado com sucesso.',
        });
      } else {
        const errorMsg = response.message || 'Login failed';
        logger.error('Auth Context', '❌ Login falhou', { message: errorMsg });
        throw new Error(errorMsg);
      }
    } catch (error) {
      logger.error('Auth Context', '❌ Erro durante login', error);
      const message = error instanceof Error ? error.message : 'Não foi possível concluir o login. Tente novamente.';
      toast.error('Falha ao entrar', {
        description: message,
      });
      throw error;
    } finally {
      setIsLoading(false);
      logger.debug('Auth Context', 'Processo de login finalizado');
    }
  }, []);


  const refreshUser = useCallback(async () => {
    logger.info('Auth Context', '🔄 Atualizando dados do usuário...');
    
    try {
      // Clear cached user to force fresh fetch
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('currentUser');
        window.localStorage.removeItem('currentUser');
        logger.debug('Auth Context', '🗑️ Cache do usuário limpo');
      }
      
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      logger.success('Auth Context', '✅ Dados do usuário atualizados', {
        userId: currentUser.id,
        email: currentUser.email
      });
      
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.localStorage.removeItem('currentUser');
        logger.debug('Auth Context', 'Novos dados do usuário salvos no sessionStorage');
      }
    } catch (error) {
      logger.error('Auth Context', '❌ Erro ao atualizar dados do usuário', error);
      const message = error instanceof Error ? error.message : '';
      const isUnauthorized = message.toLowerCase().includes('unauthorized') || message.includes('401');
      logout(
        isUnauthorized
          ? 'Sua sessão expirou. Faça login novamente.'
          : 'Não foi possível atualizar seus dados. Faça login novamente para continuar.'
      );
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


