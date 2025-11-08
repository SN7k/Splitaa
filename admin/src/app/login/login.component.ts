import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface Admin {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  createdAt: string;
  lastLogin: string | null;
  isActive: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  showPassword = false;
  rememberMe = false;
  isLoading = false;

  constructor(private http: HttpClient, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.error = '';
    this.isLoading = true;

    // Trim input values
    const emailInput = this.email.trim();
    const passwordInput = this.password.trim();

    // Load admins from JSON file in public folder
    this.http.get<Admin[]>('data/admins.json').subscribe({
      next: (admins) => {
        // Find matching admin
        const admin = admins.find(
          a => {
            const emailMatch = a.email.trim() === emailInput;
            const passwordMatch = a.password.trim() === passwordInput;
            return emailMatch && passwordMatch && a.isActive;
          }
        );

        setTimeout(() => {
          if (admin) {
            // Store authentication data
            localStorage.setItem('auth_token', `token-${admin.id}`);
            localStorage.setItem('admin_user', JSON.stringify({
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role
            }));
            
            if (this.rememberMe) {
              localStorage.setItem('remember_me', 'true');
            }
            
            this.router.navigate(['/dashboard']);
            this.error = '';
          } else {
            this.error = 'Invalid email or password. Please try again.';
            this.isLoading = false;
          }
        }, 800);
      },
      error: (err) => {
        this.error = 'Unable to authenticate. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
