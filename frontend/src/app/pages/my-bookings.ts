import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { BookingService } from '../core/booking.service';
import { Booking } from '../core/models';
import { extractError } from '../core/http-error';

@Component({
  selector: 'app-my-bookings',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatCardModule, MatButtonModule],
  template: `
    <div class="page">
      <h1>My bookings</h1>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p>Loading...</p>
      } @else if (items().length === 0) {
        <p>You have no bookings yet. <a routerLink="/">Find a warehouse</a></p>
      } @else {
        <div class="list">
          @for (b of items(); track b.id) {
            <mat-card class="card">
              <mat-card-header>
                <mat-card-title>{{ b.warehouseTitle }}</mat-card-title>
                <mat-card-subtitle>{{ b.warehouseCity }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>
                  <span class="badge" [class]="'badge ' + b.status">{{ label(b.status) }}</span>
                </p>
                <p>{{ b.startDate }} to {{ b.endDate }} ({{ b.days }} days)</p>
                <p class="total">{{ b.totalAmount | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
                @if (b.status === 'PendingPayment' && b.holdExpiresAt) {
                  <p class="muted">Dates held until {{ b.holdExpiresAt | date: 'shortTime' }}</p>
                }
              </mat-card-content>
              @if (b.status === 'PendingPayment') {
                <mat-card-actions>
                  <button mat-flat-button disabled>Pay now (coming next)</button>
                  <button mat-button (click)="cancel(b)">Cancel</button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page {
      padding: 24px 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    .list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      padding: 8px;
    }
    .total {
      font-weight: 600;
    }
    .muted {
      color: #78909c;
    }
    .error {
      color: #b3261e;
    }
    .badge {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      background: #e0e0e0;
    }
    .badge.PendingPayment {
      background: #fff3cd;
      color: #7a5b00;
    }
    .badge.Confirmed {
      background: #d4edda;
      color: #1d5b2e;
    }
    .badge.Cancelled,
    .badge.Expired {
      background: #eceff1;
      color: #546e7a;
    }
  `,
})
export class MyBookings {
  private service = inject(BookingService);

  items = signal<Booking[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  label(status: string): string {
    return status === 'PendingPayment' ? 'Awaiting payment' : status;
  }

  cancel(b: Booking): void {
    if (!confirm('Cancel this booking and release the dates?')) return;
    this.error.set(null);
    this.service.cancel(b.id).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(extractError(e)),
    });
  }

  private load(): void {
    this.service.getMine().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(extractError(e));
        this.loading.set(false);
      },
    });
  }
}
