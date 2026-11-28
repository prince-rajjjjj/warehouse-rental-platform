import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../core/auth.service';
import { BookingService } from '../core/booking.service';
import { PaymentService } from '../core/payment.service';
import { Booking, RazorpaySuccess } from '../core/models';
import { extractError } from '../core/http-error';

@Component({
  selector: 'app-my-bookings',
  imports: [RouterLink, CurrencyPipe, DatePipe, MatCardModule, MatButtonModule],
  template: `
    <div class="page">
      <h1>My bookings</h1>

      @if (message()) {
        <p class="success">{{ message() }}</p>
      }
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
                  <button mat-flat-button [disabled]="payingId() !== null" (click)="pay(b)">
                    {{ payingId() === b.id ? 'Processing...' : 'Pay now' }}
                  </button>
                  <button mat-button [disabled]="payingId() !== null" (click)="cancel(b)">Cancel</button>
                </mat-card-actions>
              }
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page { padding: 24px 16px; max-width: 800px; margin: 0 auto; }
    .list { display: flex; flex-direction: column; gap: 16px; }
    .card { padding: 8px; }
    .total { font-weight: 600; }
    .muted { color: #78909c; }
    .error { color: #b3261e; }
    .success { color: #1d5b2e; font-weight: 600; }
    .badge { padding: 2px 10px; border-radius: 12px; font-size: 12px; background: #e0e0e0; }
    .badge.PendingPayment { background: #fff3cd; color: #7a5b00; }
    .badge.Confirmed { background: #d4edda; color: #1d5b2e; }
    .badge.Cancelled, .badge.Expired { background: #eceff1; color: #546e7a; }
  `,
})
export class MyBookings {
  private bookings = inject(BookingService);
  private payments = inject(PaymentService);
  private auth = inject(AuthService);

  items = signal<Booking[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  message = signal<string | null>(null);
  payingId = signal<number | null>(null);

  constructor() {
    this.load();
  }

  label(status: string): string {
    return status === 'PendingPayment' ? 'Awaiting payment' : status;
  }

  pay(b: Booking): void {
    const user = this.auth.user();
    if (!user) return;

    this.error.set(null);
    this.message.set(null);
    this.payingId.set(b.id);

    // 1. Ask our server to create the order.
    this.payments.createOrder(b.id).subscribe({
      next: (order) => {
        // 2. Open Razorpay's popup.
        this.payments.openCheckout(
          order,
          user,
          (result) => this.confirm(b, result),   // paid
          () => this.payingId.set(null),         // closed without paying
        );
      },
      error: (e) => {
        this.error.set(extractError(e));
        this.payingId.set(null);
        this.load();
      },
    });
  }

  // 3. Send the result to our server, which verifies the signature.
  private confirm(b: Booking, r: RazorpaySuccess): void {
    this.payments
      .verify({
        bookingId: b.id,
        razorpayOrderId: r.razorpay_order_id,
        razorpayPaymentId: r.razorpay_payment_id,
        razorpaySignature: r.razorpay_signature,
      })
      .subscribe({
        next: () => {
          this.message.set('Payment successful. Your booking is confirmed.');
          this.payingId.set(null);
          this.load();
        },
        error: (e) => {
          this.error.set(extractError(e));
          this.payingId.set(null);
          this.load();
        },
      });
  }

  cancel(b: Booking): void {
    if (!confirm('Cancel this booking and release the dates?')) return;
    this.error.set(null);
    this.bookings.cancel(b.id).subscribe({
      next: () => this.load(),
      error: (e) => this.error.set(extractError(e)),
    });
  }

  private load(): void {
    this.bookings.getMine().subscribe({
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