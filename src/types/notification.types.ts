// Notification Types

export type NotificationType = 'user.created' | 'user.disabled' | 'teacher.created';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export interface KafkaEvent {
  eventType: NotificationType;
  timestamp: string;
  data: {
    userId?: string | number;
    userEmail?: string;
    userName?: string;
    userRole?: string;
    teacherId?: string | number;
    teacherName?: string;
    teacherEmail?: string;
    status?: string;
    [key: string]: any;
  };
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  message?: string;
}

