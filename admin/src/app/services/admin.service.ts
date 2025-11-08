import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'https://splitaa-backend-16104559665.asia-south1.run.app/api';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any[]> {
    const token = localStorage.getItem('auth_token');
    return this.http.get<any[]>(`${this.apiUrl}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }

  getGroups(): Observable<any[]> {
    const token = localStorage.getItem('auth_token');
    return this.http.get<any[]>(`${this.apiUrl}/groups`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
}

