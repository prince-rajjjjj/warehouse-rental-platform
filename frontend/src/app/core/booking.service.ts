import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Booking, CreateBookingRequest } from './models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/bookings`;

  create(body: CreateBookingRequest) {
    return this.http.post<Booking>(this.baseUrl, body);
  }

  getMine() {
    return this.http.get<Booking[]>(`${this.baseUrl}/my`);
  }

  cancel(id: number) {
    return this.http.post<void>(`${this.baseUrl}/${id}/cancel`, {});
  }
}