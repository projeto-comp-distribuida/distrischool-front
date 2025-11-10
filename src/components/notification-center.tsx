"use client"

import { useEffect, useState, useCallback } from 'react';
import { Bell, X, UserPlus, UserX, GraduationCap, Wifi, WifiOff } from 'lucide-react';
import { notificationService } from '@/services/notification.service';
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type { Notification } from '@/types/notification.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface NotificationCenterProps {
  isAdmin: boolean;
}

export function NotificationCenter({ isAdmin }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  // Load notifications from REST API
  const loadNotifications = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    logger.info('NotificationCenter', 'Carregando notificações...');
    
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
      logger.success('NotificationCenter', `✅ ${data.length} notificações carregadas`);
    } catch (error) {
      logger.error('NotificationCenter', 'Erro ao carregar notificações', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Handle new notification from WebSocket
  const handleNewNotification = useCallback((notification: Notification) => {
    logger.info('NotificationCenter', 'Nova notificação recebida via WebSocket', {
      id: notification.id,
      type: notification.type
    });

    setNotifications(prev => {
      // Evitar duplicatas
      const exists = prev.find(n => n.id === notification.id);
      if (exists) {
        logger.debug('NotificationCenter', 'Notificação já existe, ignorando', { id: notification.id });
        return prev;
      }

      // Adicionar no início da lista
      const updated = [notification, ...prev];
      logger.success('NotificationCenter', `Notificação adicionada. Total: ${updated.length}`);
      return updated;
    });
  }, []);

  // Connect WebSocket when component mounts and user is admin
  useEffect(() => {
    if (!isAdmin) {
      logger.debug('NotificationCenter', 'Usuário não é admin, WebSocket não será conectado');
      return;
    }

    logger.info('NotificationCenter', 'Inicializando sistema de notificações...');

    // Load initial notifications
    loadNotifications();

    // Get token and connect WebSocket
    const token = apiClient.getToken();
    if (token) {
      logger.info('NotificationCenter', 'Token encontrado, conectando WebSocket...');
      
      // Connect WebSocket
      notificationService.connectWebSocket(token, handleNewNotification);

      // Monitor WebSocket status
      const checkStatus = setInterval(() => {
        const status = notificationService.getWebSocketStatus();
        setWsStatus(status);
        logger.debug('NotificationCenter', `Status WebSocket: ${status}`);
      }, 1000);

      // Cleanup on unmount
      return () => {
        logger.info('NotificationCenter', 'Desmontando componente, desconectando WebSocket...');
        clearInterval(checkStatus);
        notificationService.disconnectWebSocket();
      };
    } else {
      logger.warn('NotificationCenter', 'Token não encontrado, WebSocket não será conectado');
    }
  }, [isAdmin, loadNotifications, handleNewNotification]);

  // Get notification icon
  const getIcon = (type: string) => {
    switch (type) {
      case 'user.created':
      case 'teacher.created':
        return <UserPlus className="h-5 w-5 text-green-600" />;
      case 'user.disabled':
        return <UserX className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-blue-600" />;
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId: string) => {
    logger.info('NotificationCenter', `Dispensando notificação: ${notificationId}`);
    
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      logger.debug('NotificationCenter', `Notificação removida. Total: ${updated.length}`);
      return updated;
    });

    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      logger.error('NotificationCenter', `Erro ao marcar notificação como lida: ${notificationId}`, error);
      // Reverter remoção em caso de erro
      loadNotifications();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  // Get WebSocket status icon
  const getWsStatusIcon = () => {
    switch (wsStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'error':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };

  if (!isAdmin) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => {
          logger.info('NotificationCenter', `Abrindo/fechando centro de notificações. Aberto: ${!isOpen}`);
          setIsOpen(!isOpen);
          if (!isOpen) {
            // Recarregar notificações quando abrir
            loadNotifications();
          }
        }}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => {
              logger.debug('NotificationCenter', 'Fechando via backdrop');
              setIsOpen(false);
            }}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 z-50">
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Notificações</CardTitle>
                    {getWsStatusIcon()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      logger.debug('NotificationCenter', 'Fechando via botão X');
                      setIsOpen(false);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas lidas'}
                  {wsStatus === 'connected' && ' • Tempo real ativo'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-6 text-center text-muted-foreground">
                      Carregando...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      Nenhuma notificação
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors ${
                            !notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimestamp(notification.timestamp)}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => dismissNotification(notification.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
