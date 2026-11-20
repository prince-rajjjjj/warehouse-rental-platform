import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PagedResult, PublicWarehouse, WarehouseSearchQuery } from './models';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/warehouses`;

  search(q: WarehouseSearchQuery) {
    let params = new HttpParams().set('page', q.page).set('pageSize', q.pageSize);

    if (q.city?.trim()) params = params.set('city', q.city.trim());
    if (q.type) params = params.set('type', q.type);
    if (q.minPrice != null) params = params.set('minPrice', q.minPrice);
    if (q.maxPrice != null) params = params.set('maxPrice', q.maxPrice);
    if (q.sort) params = params.set('sort', q.sort);

    return this.http.get<PagedResult<PublicWarehouse>>(this.baseUrl, { params });
  }

  getOne(id: number) {
    return this.http.get<PublicWarehouse>(`${this.baseUrl}/${id}`);
  }
}