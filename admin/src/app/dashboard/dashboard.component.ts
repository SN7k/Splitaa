import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { NotificationService } from '../services/notification.service';
import { NotificationPanelComponent } from './notification-panel.component';
import { Observable } from 'rxjs';

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface User {
  id?: number;
  name: string;
  email: string;
  gender?: 'male' | 'female';
}

interface Group {
  id?: number;
  name: string;
}

interface Expense {
  id?: number;
  description: string;
  amount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, NotificationPanelComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  users: User[] = [];
  groups: Group[] = [];
  expenses: Expense[] = [];
  settlements = 8;
  activeUsers = 3;
  inactiveUsers = 2;

  // Notification observables
  unreadCount$: Observable<number>;

  // Computed properties for stats
  get totalUsers(): number {
    return this.users.length;
  }

  get totalGroups(): number {
    return this.groups.length;
  }

  get totalExpenses(): number {
    return this.expenses.length;
  }

  get maleUsers(): number {
    return this.users.filter(u => u.gender === 'male').length;
  }

  get femaleUsers(): number {
    return this.users.filter(u => u.gender === 'female').length;
  }

  constructor(
    private adminService: AdminService,
    private router: Router,
    private notificationService: NotificationService
  ) {
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Mock data - In production, this would fetch from API
    this.users = [
      { id: 1, name: 'Alice', email: 'alice@example.com', gender: 'female' },
      { id: 2, name: 'Bob', email: 'bob@example.com', gender: 'male' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com', gender: 'male' },
      { id: 4, name: 'Diana', email: 'diana@example.com', gender: 'female' },
      { id: 5, name: 'Eve', email: 'eve@example.com', gender: 'female' }
    ];
    this.groups = [
      { id: 1, name: 'Trip to Goa' },
      { id: 2, name: 'Roommates' },
      { id: 3, name: 'Office Party' },
      { id: 4, name: 'Family Vacation' },
      { id: 5, name: 'Weekend Getaway' }
    ];
    this.expenses = [
      { id: 1, description: 'Dinner', amount: 500 },
      { id: 2, description: 'Groceries', amount: 300 },
      { id: 3, description: 'Transport', amount: 400 },
      { id: 4, description: 'Utilities', amount: 500 },
      { id: 5, description: 'Entertainment', amount: 100 },
      { id: 6, description: 'Shopping', amount: 250 }
    ];
  }

  // Chart helper methods
  getUserPieSegment(index: number): string {
    const total = this.activeUsers + this.inactiveUsers;
    const value = index === 0 ? this.activeUsers : this.inactiveUsers;
    const percentage = (value / total) * 100;
    const circumference = 2 * Math.PI * 80;
    const dashLength = (percentage / 100) * circumference;
    return `${dashLength} ${circumference}`;
  }

  getUserPieOffset(index: number): number {
    if (index === 0) return 0;
    const total = this.activeUsers + this.inactiveUsers;
    const prevPercentage = (this.activeUsers / total) * 100;
    const circumference = 2 * Math.PI * 80;
    return -(prevPercentage / 100) * circumference;
  }

  // Gender pie chart methods
  getGenderPieSegment(index: number): string {
    const total = this.maleUsers + this.femaleUsers;
    const value = index === 0 ? this.maleUsers : this.femaleUsers;
    const percentage = (value / total) * 100;
    const circumference = 2 * Math.PI * 80;
    const dashLength = (percentage / 100) * circumference;
    return `${dashLength} ${circumference}`;
  }

  getGenderPieOffset(index: number): number {
    if (index === 0) return 0;
    const total = this.maleUsers + this.femaleUsers;
    const prevPercentage = (this.maleUsers / total) * 100;
    const circumference = 2 * Math.PI * 80;
    return -(prevPercentage / 100) * circumference;
  }

  getBarHeight(amount: number): number {
    const maxAmount = Math.max(...this.expenses.map(e => e.amount));
    return (amount / maxAmount) * 100;
  }

  toggleNotifications(): void {
    this.notificationService.togglePanel();
  }

  logout() {
    // Clear authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_user');
    localStorage.removeItem('remember_me');
    
    // Navigate to login page
    this.router.navigate(['/login']);
  }
}




