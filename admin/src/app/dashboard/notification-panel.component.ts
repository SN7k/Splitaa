import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-overlay" *ngIf="showPanel$ | async" (click)="closePanel()"></div>
    
    <div class="notification-panel" *ngIf="showPanel$ | async">
      <div class="notification-header">
        <h2>Notifications</h2>
        <div class="header-actions">
          <button class="btn-small" (click)="markAllAsRead()" *ngIf="(unreadCount$ | async) as count">
            Mark all as read
          </button>
          <button class="btn-close" (click)="closePanel()">✕</button>
        </div>
      </div>

      <div class="notification-list">
        <div *ngIf="(notifications$ | async) as notifs">
          <div *ngIf="notifs.length === 0" class="empty-state">
            <p>📭 No notifications</p>
          </div>

          <div
            *ngFor="let notif of notifs"
            class="notification-item"
            [class.unread]="!notif.read"
            (click)="markAsRead(notif.id)"
          >
            <div class="notif-icon">{{ notif.icon }}</div>
            <div class="notif-content">
              <div class="notif-title">{{ notif.title }}</div>
              <div class="notif-message">{{ notif.message }}</div>
              <div class="notif-time">{{ formatTime(notif.timestamp) }}</div>
            </div>
            <button class="btn-delete" (click)="deleteNotification(notif.id, $event)">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <div class="notification-footer">
        <button class="btn-clear" (click)="clearAll()">Clear All</button>
      </div>
    </div>
  `,
  styles: [`
    .notification-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
    }

    .notification-panel {
      position: fixed;
      top: 60px;
      right: 20px;
      width: 380px;
      max-height: 600px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .notification-header {
      padding: 16px;
      border-bottom: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 18px;
        color: #1F2937;
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .btn-small, .btn-close {
      padding: 6px 12px;
      background: none;
      border: 1px solid #E5E7EB;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      color: #6B7280;
      transition: all 0.2s;

      &:hover {
        background: #F3F4F6;
        color: #1F2937;
      }
    }

    .btn-close {
      padding: 4px 8px;
      font-size: 16px;
    }

    .notification-list {
      flex: 1;
      overflow-y: auto;
      max-height: 450px;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #9CA3AF;
      font-size: 14px;
    }

    .notification-item {
      padding: 12px 16px;
      border-bottom: 1px solid #F3F4F6;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #F9FAFB;
      }

      &.unread {
        background: #F0FDF4;
        border-left: 3px solid #10B981;
        padding-left: 13px;
      }
    }

    .notif-icon {
      font-size: 20px;
      min-width: 24px;
      text-align: center;
    }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-title {
      font-weight: 600;
      color: #1F2937;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .notif-message {
      color: #6B7280;
      font-size: 12px;
      margin-bottom: 4px;
      line-height: 1.4;
    }

    .notif-time {
      color: #9CA3AF;
      font-size: 11px;
    }

    .btn-delete {
      padding: 4px 6px;
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    .notification-footer {
      padding: 12px 16px;
      border-top: 1px solid #E5E7EB;
      text-align: center;
    }

    .btn-clear {
      padding: 8px 16px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      border-radius: 4px;
      color: #DC2626;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #FEE2E2;
      }
    }

    @media (max-width: 768px) {
      .notification-panel {
        width: calc(100% - 40px);
        right: 20px;
        left: 20px;
      }
    }
  `]
})
export class NotificationPanelComponent implements OnInit {
  notifications$: Observable<Notification[]>;
  unreadCount$: Observable<number>;
  showPanel$: Observable<boolean>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
    this.showPanel$ = this.notificationService.showPanel$;
  }

  ngOnInit(): void {}

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(notificationId: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId);
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }

  closePanel(): void {
    this.notificationService.closePanel();
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString();
  }
}
