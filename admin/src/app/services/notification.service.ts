import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  icon?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  private showPanelSubject = new BehaviorSubject<boolean>(false);
  public showPanel$ = this.showPanelSubject.asObservable();

  constructor() {
    this.loadNotifications();
    this.addMockNotifications();
  }

  // Add a new notification
  addNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false,
      icon: this.getIconForType(type)
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Mark all as read
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value.map(n => ({
      ...n,
      read: true
    }));
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Delete notification
  deleteNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value.filter(
      n => n.id !== notificationId
    );
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Clear all notifications
  clearAll(): void {
    this.notificationsSubject.next([]);
    this.updateUnreadCount();
    this.saveNotifications();
  }

  // Toggle notification panel
  togglePanel(): void {
    const current = this.showPanelSubject.value;
    this.showPanelSubject.next(!current);
  }

  // Close panel
  closePanel(): void {
    this.showPanelSubject.next(false);
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notificationsSubject.value.filter(n => !n.read).length;
  }

  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(count);
  }

  private generateId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getIconForType(type: string): string {
    const icons: { [key: string]: string } = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  }

  private saveNotifications(): void {
    const notifications = this.notificationsSubject.value;
    localStorage.setItem('admin-notifications', JSON.stringify(notifications));
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem('admin-notifications');
      if (stored) {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Mock notifications for demo
  private addMockNotifications(): void {
    const current = this.notificationsSubject.value;
    if (current.length === 0) {
      this.addNotification(
        'Welcome Admin',
        'Welcome to the Splitaa Admin Dashboard',
        'success'
      );
      this.addNotification(
        'New User Registered',
        'A new user has registered in the system',
        'info'
      );
      this.addNotification(
        'High Expense Alert',
        'An expense of $5000 was recorded today',
        'warning'
      );
    }
  }
}
