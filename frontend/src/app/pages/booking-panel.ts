import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BookingService } from '../core/booking.service';
import { WarehouseService } from '../core/warehouse.service';
import { UnavailableRange } from '../core/models';
import { daysBetween, toIsoDate } from '../core/date-utils';
import { extractError } from '../core/http-error';

const MIN_DAYS = 7;
const MAX_DAYS = 365;

@Component({
  selector: 'app-booking-panel',
  imports: [
    ReactiveFormsModule,
    CurrencyPipe,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <mat-form-field appearance="outline" class="full">
      <mat-label>Rental period</mat-label>
      <mat-date-range-input
        [formGroup]="range"
        [rangePicker]="picker"
        [min]="today"
        [dateFilter]="dateFilter"
      >
        <input matStartDate formControlName="start" placeholder="Start" />
        <input matEndDate formControlName="end" placeholder="End" />
      </mat-date-range-input>
      <mat-datepicker-toggle matIconSuffix [for]="picker" />
      <mat-date-range-picker #picker />
    </mat-form-field>

    @if (days() > 0) {
      <div class="summary">
        <div>{{ days() }} days</div>
        <div class="total">{{ total() | currency: 'INR' : 'symbol' : '1.0-0' }}</div>
        <div class="note">Final price is confirmed by the server.</div>
      </div>
    }

    @if (problem(); as p) {
      <p class="error">{{ p }}</p>
    }
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }

    <button mat-flat-button class="full" [disabled]="!canReserve()" (click)="reserve()">
      {{ loading() ? 'Reserving...' : 'Reserve' }}
    </button>
    <p class="note">Your dates are held for 15 minutes while you pay.</p>
  `,
  styles: `
    .full { width: 100%; }
    .summary { margin: 8px 0 16px; }
    .total { font-size: 22px; font-weight: 600; }
    .note { color: #78909c; font-size: 12px; margin: 4px 0; }
    .error { color: #b3261e; margin: 8px 0; }
  `,
})
export class BookingPanel implements OnInit {
  private bookings = inject(BookingService);
  private warehouses = inject(WarehouseService);
  private router = inject(Router);

  warehouseId = input.required<number>();
  pricePerMonth = input.required<number>();

  today = new Date();
  unavailable = signal<UnavailableRange[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  ngOnInit(): void {
    this.loadAvailability();
  }

  // Greys out days inside an already-booked range.
  dateFilter = (d: Date | null): boolean => {
    if (!d) return true;
    const day = toIsoDate(d);
    return !this.unavailable().some((r) => day >= r.start && day < r.end);
  };

  days(): number {
    const { start, end } = this.range.value;
    return start && end ? daysBetween(start, end) : 0;
  }

  total(): number {
    return Math.round(((this.pricePerMonth() * this.days()) / 30) * 100) / 100;
  }

  problem(): string | null {
    const { start, end } = this.range.value;
    if (!start || !end) return null;

    const days = this.days();
    if (days < MIN_DAYS) return `The minimum booking is ${MIN_DAYS} days.`;
    if (days > MAX_DAYS) return `The maximum booking is ${MAX_DAYS} days.`;

    const s = toIsoDate(start);
    const e = toIsoDate(end);
    if (this.unavailable().some((r) => s < r.end && e > r.start)) {
      return 'Some of these dates are already booked.';
    }
    return null;
  }

  canReserve(): boolean {
    const { start, end } = this.range.value;
    return !!start && !!end && !this.problem() && !this.loading();
  }

  reserve(): void {
    const { start, end } = this.range.value;
    if (!start || !end || this.problem()) return;

    this.loading.set(true);
    this.error.set(null);

    this.bookings
      .create({
        warehouseId: this.warehouseId(),
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/bookings'),
        error: (e) => {
          this.error.set(extractError(e));
          this.loading.set(false);
          if (e?.status === 409) this.loadAvailability();
        },
      });
  }

  private loadAvailability(): void {
    this.warehouses.getAvailability(this.warehouseId()).subscribe({
      next: (r) => this.unavailable.set(r),
      error: () => this.unavailable.set([]),
    });
  }
}