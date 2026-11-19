import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { OwnerWarehouse, WarehouseRequest } from './models';

@Injectable({ providedIn: 'root' })
export class OwnerWarehouseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/owner/warehouses`;

  getMine() {
    return this.http.get<OwnerWarehouse[]>(this.baseUrl);
  }

  getOne(id: number) {
    return this.http.get<OwnerWarehouse>(`${this.baseUrl}/${id}`);
  }

  create(data: WarehouseRequest) {
    return this.http.post<OwnerWarehouse>(this.baseUrl, data);
  }

  update(id: number, data: WarehouseRequest) {
    return this.http.put<OwnerWarehouse>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}