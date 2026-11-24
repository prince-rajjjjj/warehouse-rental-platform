import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BookingService } from '../core/booking.service';
import { WarehouseService } from '../core/warehouse.service';
import { UnavailableRange } from '../core/models';
import { AppDateAdapter, APP_DATE_FORMATS } from '../core/date-adapter';
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
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
  template: `
    <div [formGroup]="range">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Start date</mat-label>
        <input
          matInput
          [matDatepicker]="startPicker"
          formControlName="start"
          placeholder="DD/MM/YYYY"
          [min]="today"
          [matDatepickerFilter]="startFilter"
        />
        <mat-hint>DD/MM/YYYY</mat-hint>
        <mat-datepicker-toggle matIconSuffix [for]="startPicker" />
        <mat-datepicker #startPicker />
        <mat-error>{{ startError() }}</mat-error>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full">
        <mat-label>End date</mat-label>
        <input
          matInput
          [matDatepicker]="endPicker"
          formControlName="end"
          placeholder="DD/MM/YYYY"
          [min]="minEnd()"
          [matDatepickerFilter]="endFilter"
        />
        <mat-hint>DD/MM/YYYY, at least {{ minDays }} days after start</mat-hint>
        <mat-datepicker-toggle matIconSuffix [for]="endPicker" />
        <mat-datepicker #endPicker [startAt]="minEnd()" />
        <mat-error>{{ endError() }}</mat-error>
      </mat-form-field>
    </div>

    @if (days() > 0 && range.valid) {
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

  minDays = MIN_DAYS;
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

  // Start day: greyed out if it falls inside a booked period.
  startFilter = (d: Date | null): boolean => {
    if (!d) return true;
    const day = toIsoDate(d);
    return !this.unavailable().some((r) => day >= r.start && day < r.end);
  };

  // End (checkout) day: greyed out if it would end inside or at the end of a booked period.
  endFilter = (d: Date | null): boolean => {
    if (!d) return true;
    const day = toIsoDate(d);
    return !this.unavailable().some((r) => day > r.start && day <= r.end);
  };

  // Earliest allowed end date: start date plus the minimum number of days.
  minEnd(): Date {
    const base = this.range.value.start ?? this.today;
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + MIN_DAYS);
  }

  startError(): string {
    const c = this.range.controls.start;
    if (c.hasError('matDatepickerParse')) return 'Enter a valid date as DD/MM/YYYY';
    if (c.hasError('matDatepickerMin')) return "The start date can't be in the past";
    if (c.hasError('matDatepickerFilter')) return 'This date is already booked';
    return '';
  }

  endError(): string {
    const c = this.range.controls.end;
    if (c.hasError('matDatepickerParse')) return 'Enter a valid date as DD/MM/YYYY';
    if (c.hasError('matDatepickerMin')) return `End date must be at least ${MIN_DAYS} days after the start date`;
    if (c.hasError('matDatepickerFilter')) return 'This date is not available';
    return '';
  }

  days(): number {
    const { start, end } = this.range.value;
    return start && end ? daysBetween(start, end) : 0;
  }

  total(): number {
    return Math.round(((this.pricePerMonth() * this.days()) / 30) * 100) / 100;
  }

  // Problems the fields can't show on their own.
  problem(): string | null {
    const { start, end } = this.range.value;
    if (!start || !end || this.range.invalid) return null;

    if (this.days() > MAX_DAYS) return `The maximum booking is ${MAX_DAYS} days.`;

    const s = toIsoDate(start);
    const e = toIsoDate(end);
    if (this.unavailable().some((r) => s < r.end && e > r.start)) {
      return 'Some days between these dates are already booked.';
    }
    return null;
  }

  canReserve(): boolean {
    const { start, end } = this.range.value;
    return !!start && !!end && this.range.valid && !this.problem() && !this.loading();
  }

  reserve(): void {
    const { start, end } = this.range.value;
    if (!start || !end || !this.canReserve()) return;

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