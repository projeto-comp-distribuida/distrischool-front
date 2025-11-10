import { NextResponse } from 'next/server';
import type { NotificationsResponse, KafkaEvent } from '@/types/notification.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.7:8080';

/**
 * Convert Kafka event to notification
 */
function eventToNotification(event: KafkaEvent) {
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
 * Poll Kafka for new events
 * 
 * Strategy: Since KafkaJS doesn't support simple polling well in Next.js context,
 * we'll implement a hybrid approach:
 * 1. Try to query the backend for events/notifications if available
 * 2. Fall back to direct Kafka polling if needed
 * 3. For now, return empty array (will be replaced with actual implementation)
 */
async function pollKafkaEvents(): Promise<KafkaEvent[]> {
  console.log('Polling Kafka events...');
  
  // For development: return mock events
  // In production, this should query backend or use proper Kafka consumer
  const MOCK_MODE = process.env.NODE_ENV === 'development';
  
  if (MOCK_MODE) {
    // Mock data for testing
    // In real implementation, this would come from Kafka or backend
    const mockEvents: KafkaEvent[] = [
      {
        eventType: 'teacher.created',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
        data: {
          teacherId: 1,
          teacherName: 'Prof. João Silva',
          teacherEmail: 'joao.silva@distrischool.com',
        },
      },
      {
        eventType: 'user.created',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
        data: {
          userId: 100,
          userName: 'Maria Santos',
          userEmail: 'maria.santos@example.com',
          userRole: 'STUDENT',
        },
      },
      {
        eventType: 'user.disabled',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
        data: {
          userId: 50,
          userName: 'Pedro Costa',
          userEmail: 'pedro.costa@example.com',
          userRole: 'TEACHER',
          status: 'disabled',
        },
      },
    ];
    
    console.log('Returning mock events:', mockEvents.length);
    return mockEvents;
  }
  
  try {
    // TODO: Implement actual Kafka polling or backend query
    // Option 1: Query backend endpoint that aggregates Kafka events
    // Option 2: Use a proper Kafka consumer pattern with state management
    // Option 3: Use WebSockets for real-time notifications
    
    return [];
  } catch (error) {
    console.error('Error polling Kafka events:', error);
    return [];
  }
}

/**
 * GET /api/notifications
 * Returns unread notifications from Kafka events
 */
export async function GET() {
  try {
    // Poll Kafka for new events
    const events = await pollKafkaEvents();
    
    // Convert events to notifications
    const notifications = events.map(eventToNotification);
    
    const response: NotificationsResponse = {
      success: true,
      data: notifications,
      message: `Found ${notifications.length} notifications`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    
    const response: NotificationsResponse = {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Failed to fetch notifications',
    };

    return NextResponse.json(response, { status: 500 });
  }
}

