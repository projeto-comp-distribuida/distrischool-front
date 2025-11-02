// Notification Service

import type { Notification, KafkaEvent, NotificationsResponse } from '@/types/notification.types';

class NotificationService {
  private basePath = '/api/notifications';
  private API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.7:8080';

  /**
   * Fetch notifications from server-side API route
   * This will call our Next.js API route which polls Kafka
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await fetch('/api/notifications');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result: NotificationsResponse = await response.json();
      
      if (result.success && result.data) {
        return result.data;
      }

      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Convert Kafka event to notification
   */
  private eventToNotification(event: KafkaEvent): Notification {
    const notification = {
      id: `${event.eventType}-${Date.now()}-${Math.random()}`,
      type: event.eventType,
      timestamp: event.timestamp,
      read: false,
      data: event.data,
    };

    switch (event.eventType) {
      case 'user.created':
        return {
          ...notification,
          title: 'Novo Usuário Criado',
          message: `Usuário ${event.data.userName || event.data.userEmail} criado com sucesso`,
        };
      
      case 'user.disabled':
        return {
          ...notification,
          title: 'Usuário Desabilitado',
          message: `Usuário ${event.data.userName || event.data.userEmail} foi desabilitado`,
        };
      
      case 'teacher.created':
        return {
          ...notification,
          title: 'Novo Professor Criado',
          message: `Professor ${event.data.teacherName || event.data.teacherEmail} cadastrado`,
        };
      
      default:
        return {
          ...notification,
          title: 'Notificação',
          message: 'Nova notificação disponível',
        };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Get event type icon
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
   * Get event type color
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

