import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { AdminWarehouse } from './models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;

  getPending() {
    return this.http.get<AdminWarehouse[]>(`${this.baseUrl}/warehouses/pending`);
  }

  approve(id: number) {
    return this.http.post<{ id: number; status: string }>(`${this.baseUrl}/warehouses/${id}/approve`, {});
  }

  reject(id: number) {
    return this.http.post<{ id: number; status: string }>(`${this.baseUrl}/warehouses/${id}/reject`, {});
  }
}