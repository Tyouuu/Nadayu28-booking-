// Notification Management Service
// Handles multi-category notifications with custom subscriptions

export type NotificationCategory = 
  | 'building-notice'
  | 'facility-booking'
  | 'visitor-request'
  | 'security-alert'
  | 'maintenance-update'
  | 'payment-reminder'
  | 'community-event'
  | 'lifestyle-service';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export interface Notification {
  id: string;
  recipientId: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  content: string;
  image?: string;
  actionUrl?: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  likes: number;
  likedBy: string[];
  comments: NotificationComment[];
  targetAudience?: 'all' | 'premium-only' | 'custom';
  tags?: string[];
}

export interface NotificationComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  likes: number;
}

export interface NotificationSubscription {
  userId: string;
  categories: {
    [key in NotificationCategory]?: boolean;
  };
  pushEnabled: boolean;
  emailEnabled: boolean;
  frequency: 'immediate' | 'daily-digest' | 'weekly-digest';
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  };
}

class NotificationService {
  private notifications: Map<string, Notification> = new Map();
  private subscriptions: Map<string, NotificationSubscription> = new Map();
  private readReceipts: Map<string, Date> = new Map();

  // Get user notifications with filtering
  getUserNotifications(
    userId: string,
    filters?: {
      category?: NotificationCategory;
      unreadOnly?: boolean;
      limit?: number;
    }
  ): Notification[] {
    let notifications = Array.from(this.notifications.values()).filter(
      n => n.recipientId === userId
    );

    if (filters?.category) {
      notifications = notifications.filter(n => n.category === filters.category);
    }

    if (filters?.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters?.limit) {
      notifications = notifications.slice(0, filters.limit);
    }

    return notifications;
  }

  // Send targeted notification
  sendNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'likes' | 'likedBy' | 'comments'>): string {
    const id = `notif-${Date.now()}`;
    const fullNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      likes: 0,
      likedBy: [],
      comments: []
    };

    // Check user subscription before sending
    const subscription = this.subscriptions.get(notification.recipientId);
    if (subscription && !subscription.categories[notification.category]) {
      return id; // Silently skip if user unsubscribed
    }

    // Check quiet hours
    if (subscription?.quietHours?.enabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (this.isInQuietHours(currentTime, subscription.quietHours.startTime, subscription.quietHours.endTime)) {
        // Queue for later delivery
      }
    }

    this.notifications.set(id, fullNotification);
    return id;
  }

  // Mark notification as read
  markAsRead(notificationId: string, userId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.recipientId !== userId) return false;

    notification.read = true;
    notification.readAt = new Date();
    this.readReceipts.set(notificationId, new Date());

    return true;
  }

  // Mark all as read
  markAllAsRead(userId: string): void {
    Array.from(this.notifications.values())
      .filter(n => n.recipientId === userId && !n.read)
      .forEach(n => {
        n.read = true;
        n.readAt = new Date();
        this.readReceipts.set(n.id, new Date());
      });
  }

  // Like notification
  likeNotification(notificationId: string, userId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    if (!notification.likedBy.includes(userId)) {
      notification.likedBy.push(userId);
      notification.likes++;
    }

    return true;
  }

  // Add comment to notification
  addComment(
    notificationId: string,
    userId: string,
    userName: string,
    text: string
  ): NotificationComment | null {
    const notification = this.notifications.get(notificationId);
    if (!notification) return null;

    const comment: NotificationComment = {
      id: `comment-${Date.now()}`,
      userId,
      userName,
      text,
      timestamp: new Date(),
      likes: 0
    };

    notification.comments.push(comment);
    return comment;
  }

  // Get user subscription
  getSubscription(userId: string): NotificationSubscription {
    return this.subscriptions.get(userId) || this.createDefaultSubscription(userId);
  }

  // Update subscription
  updateSubscription(userId: string, updates: Partial<NotificationSubscription>): NotificationSubscription {
    let subscription = this.subscriptions.get(userId);
    
    if (!subscription) {
      subscription = this.createDefaultSubscription(userId);
    }

    Object.assign(subscription, updates);
    this.subscriptions.set(userId, subscription);

    return subscription;
  }

  // Toggle category subscription
  toggleCategorySubscription(userId: string, category: NotificationCategory): boolean {
    const subscription = this.getSubscription(userId);
    subscription.categories[category] = !subscription.categories[category];
    this.subscriptions.set(userId, subscription);

    return subscription.categories[category] || false;
  }

  // Get read statistics for admin
  getReadStatistics(notificationId: string): {
    total: number;
    read: number;
    readRate: number;
    avgReadTime: number; // milliseconds
  } {
    const notification = this.notifications.get(notificationId);
    if (!notification) return { total: 0, read: 0, readRate: 0, avgReadTime: 0 };

    const total = 1; // Simplified - in real app, count recipients
    const read = notification.read ? 1 : 0;
    const readRate = (read / total) * 100;
    const readTime = notification.readAt ? 
      notification.readAt.getTime() - notification.timestamp.getTime() : 0;

    return {
      total,
      read,
      readRate,
      avgReadTime: readTime
    };
  }

  // Helper: Create default subscription
  private createDefaultSubscription(userId: string): NotificationSubscription {
    const subscription: NotificationSubscription = {
      userId,
      categories: {
        'building-notice': true,
        'facility-booking': true,
        'visitor-request': true,
        'security-alert': true,
        'maintenance-update': true,
        'payment-reminder': true,
        'community-event': true,
        'lifestyle-service': true
      },
      pushEnabled: true,
      emailEnabled: false,
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    };

    this.subscriptions.set(userId, subscription);
    return subscription;
  }

  // Helper: Check if in quiet hours
  private isInQuietHours(currentTime: string, startTime: string, endTime: string): boolean {
    return currentTime >= startTime && currentTime <= endTime;
  }
}

export const notificationService = new NotificationService();
