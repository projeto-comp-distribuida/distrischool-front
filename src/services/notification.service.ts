// Notification Service - Integração com REST API e WebSocket
import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';
import type { Notification } from '@/types/notification.types';
import { websocketClient, type WebSocketMessage } from '@/lib/websocket-client';

// Obter WebSocket client apenas no cliente (browser)
const getWebSocketClient = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  return websocketClient;
};

class NotificationService {
  private basePath = '/api/v1/notifications';
  private wsConnected = false;

  /**
   * Busca notificações via REST API
   */
  async getNotifications(): Promise<Notification[]> {
    logger.info('Notification Service', `Buscando notificações via REST: GET ${this.basePath}`);
    
    try {
      const startTime = Date.now();
      const notifications = await apiClient.get<Notification[]>(this.basePath);
      const duration = Date.now() - startTime;
      
      logger.success('Notification Service', `Notificações recebidas via REST`, {
        count: notifications?.length || 0,
        duration: `${duration}ms`
      });
      
      if (notifications && Array.isArray(notifications)) {
        logger.debug('Notification Service', 'Detalhes das notificações', {
          total: notifications.length,
          unread: notifications.filter(n => !n.read).length,
          types: notifications.map(n => n.type)
        });
        return notifications;
      }
      
      logger.warn('Notification Service', 'Resposta inválida do servidor', { notifications });
      return [];
    } catch (error) {
      logger.error('Notification Service', 'Erro ao buscar notificações via REST', error);
      return [];
    }
  }

  /**
   * Conecta ao WebSocket para receber notificações em tempo real
   */
  connectWebSocket(token: string, onNotification: (notification: Notification) => void): void {
    const wsClient = getWebSocketClient();
    
    // Verificar se está no cliente
    if (!wsClient) {
      logger.warn('Notification Service', 'WebSocket não disponível no servidor');
      return;
    }

    // Evitar conexões duplicadas
    if (wsClient.isConnected()) {
      logger.warn('Notification Service', 'WebSocket já está conectado');
      return;
    }

    if (!token) {
      logger.error('Notification Service', 'Token não fornecido para conectar WebSocket');
      return;
    }

    logger.info('Notification Service', 'Conectando ao WebSocket para notificações em tempo real...');
    
    // Handler para mensagens recebidas
    const unsubscribeMessage = wsClient.onMessage((message: WebSocketMessage) => {
      logger.info('Notification Service', '📨 Mensagem WebSocket recebida', {
        type: message.type,
        hasData: !!message.data
      });

      if (message.type === 'notification' && message.data) {
        try {
          const notification = this.parseNotification(message.data);
          logger.success('Notification Service', '✅ Nova notificação recebida via WebSocket', {
            id: notification.id,
            type: notification.type,
            title: notification.title
          });
          
          onNotification(notification);
        } catch (error) {
          logger.error('Notification Service', 'Erro ao processar notificação do WebSocket', error);
        }
      } else if (message.type === 'ping') {
        logger.debug('Notification Service', '💓 Ping recebido do servidor');
        // Responder com pong se necessário
        wsClient.send({ type: 'pong' });
      } else {
        logger.debug('Notification Service', 'Tipo de mensagem desconhecido', { type: message.type });
      }
    });

    // Handler para mudanças de status
    const unsubscribeStatus = wsClient.onStatusChange((status: 'disconnected' | 'connecting' | 'connected' | 'error') => {
      logger.info('Notification Service', `Status WebSocket alterado: ${status}`);
      this.wsConnected = status === 'connected';
      
      if (status === 'connected') {
        logger.success('Notification Service', '✅ WebSocket conectado com sucesso!');
      } else if (status === 'disconnected') {
        logger.warn('Notification Service', '🔌 WebSocket desconectado');
      } else if (status === 'error') {
        logger.error('Notification Service', '❌ Erro na conexão WebSocket');
      }
    });

    // Handler para erros
    const unsubscribeError = wsClient.onError((error: Error) => {
      logger.error('Notification Service', 'Erro no WebSocket', error);
    });

    // Conectar ao WebSocket
    wsClient.connect(token);

    // Armazenar funções de cleanup (para uso futuro se necessário)
    (this as any).unsubscribeHandlers = [
      unsubscribeMessage,
      unsubscribeStatus,
      unsubscribeError
    ];
  }

  /**
   * Desconecta do WebSocket
   */
  disconnectWebSocket(): void {
    const wsClient = getWebSocketClient();
    
    // Verificar se está no cliente
    if (!wsClient) {
      return;
    }

    if (!this.wsConnected) {
      logger.warn('Notification Service', 'WebSocket já está desconectado');
      return;
    }

    logger.info('Notification Service', 'Desconectando WebSocket...');
    wsClient.disconnect();
    this.wsConnected = false;

    // Limpar handlers se existirem
    if ((this as any).unsubscribeHandlers) {
      (this as any).unsubscribeHandlers.forEach((unsubscribe: (() => void) | undefined) => {
        if (unsubscribe) {
          try {
            unsubscribe();
          } catch (error) {
            logger.error('Notification Service', 'Erro ao remover handler', error);
          }
        }
      });
      (this as any).unsubscribeHandlers = [];
    }

    logger.success('Notification Service', '✅ WebSocket desconectado');
  }

  /**
   * Marca uma notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    logger.info('Notification Service', `Marcando notificação como lida: ${notificationId}`);
    
    try {
      await apiClient.put(`${this.basePath}/${notificationId}/read`);
      logger.success('Notification Service', `✅ Notificação ${notificationId} marcada como lida`);
    } catch (error) {
      logger.error('Notification Service', `Erro ao marcar notificação como lida: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(): Promise<void> {
    logger.info('Notification Service', 'Marcando todas as notificações como lidas');
    
    try {
      await apiClient.put(`${this.basePath}/read-all`);
      logger.success('Notification Service', '✅ Todas as notificações marcadas como lidas');
    } catch (error) {
      logger.error('Notification Service', 'Erro ao marcar todas as notificações como lidas', error);
      throw error;
    }
  }

  /**
   * Deleta uma notificação
   */
  async deleteNotification(notificationId: string): Promise<void> {
    logger.info('Notification Service', `Deletando notificação: ${notificationId}`);
    
    try {
      await apiClient.delete(`${this.basePath}/${notificationId}`);
      logger.success('Notification Service', `✅ Notificação ${notificationId} deletada`);
    } catch (error) {
      logger.error('Notification Service', `Erro ao deletar notificação: ${notificationId}`, error);
      throw error;
    }
  }

  /**
   * Verifica se o WebSocket está conectado
   */
  isWebSocketConnected(): boolean {
    const wsClient = getWebSocketClient();
    if (!wsClient) {
      return false;
    }
    return wsClient.isConnected();
  }

  /**
   * Obtém o status do WebSocket
   */
  getWebSocketStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    const wsClient = getWebSocketClient();
    if (!wsClient) {
      return 'disconnected';
    }
    return wsClient.getStatus();
  }

  /**
   * Converte dados recebidos do WebSocket em Notification
   */
  private parseNotification(data: any): Notification {
    logger.debug('Notification Service', 'Parseando notificação', { data });
    
    // Se já é uma Notification válida, retornar
    if (data.id && data.type && data.title && data.message) {
      return data as Notification;
    }

    // Caso contrário, tentar construir a partir dos dados
    const notification: Notification = {
      id: data.id || `${data.type || 'notification'}-${Date.now()}-${Math.random()}`,
      type: data.type || 'user.created',
      title: data.title || this.getDefaultTitle(data.type),
      message: data.message || this.getDefaultMessage(data.type, data.data),
      timestamp: data.timestamp || new Date().toISOString(),
      read: data.read || false,
      data: data.data || data,
    };

    return notification;
  }

  /**
   * Obtém título padrão baseado no tipo
   */
  private getDefaultTitle(type: string): string {
    switch (type) {
      case 'user.created':
        return 'Novo Usuário Criado';
      case 'user.disabled':
        return 'Usuário Desabilitado';
      case 'teacher.created':
        return 'Novo Professor Criado';
      default:
        return 'Nova Notificação';
    }
  }

  /**
   * Obtém mensagem padrão baseado no tipo
   */
  private getDefaultMessage(type: string, data: any): string {
    switch (type) {
      case 'user.created':
        return `Usuário ${data?.userName || data?.userEmail || 'novo'} criado com sucesso`;
      case 'user.disabled':
        return `Usuário ${data?.userName || data?.userEmail || 'desconhecido'} foi desabilitado`;
      case 'teacher.created':
        return `Professor ${data?.teacherName || data?.teacherEmail || 'novo'} cadastrado`;
      default:
        return 'Nova notificação disponível';
    }
  }

  /**
   * Obtém ícone do tipo de evento
   */
  getEventIcon(type: string): string {
    switch (type) {
      case 'user.created':
      case 'teacher.created':
        return 'user-plus';
      case 'user.disabled':
        return 'user-x';
      default:
        return 'bell';
    }
  }

  /**
   * Obtém cor do tipo de evento
   */
  getEventColor(type: string): string {
    switch (type) {
      case 'user.created':
      case 'teacher.created':
        return 'text-green-600';
      case 'user.disabled':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  }
}

export const notificationService = new NotificationService();
