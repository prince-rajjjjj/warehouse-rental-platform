import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AdminService } from '../core/admin.service';
import { AdminWarehouse } from '../core/models';
import { extractError } from '../core/http-error';

@Component({
  selector: 'app-admin-warehouses',
  imports: [CurrencyPipe, MatCardModule, MatButtonModule],
  template: `
    <div class="page">
      <h1>Pending warehouses</h1>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p>Loading...</p>
      } @else if (items().length === 0) {
        <p>Nothing waiting for approval.</p>
      } @else {
        <div class="list">
          @for (w of items(); track w.id) {
            <mat-card class="card">
              <mat-card-header>
                <mat-card-title>{{ w.title }}</mat-card-title>
                <mat-card-subtitle>{{ w.address }}, {{ w.city }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ w.description }}</p>
                <p>
                  {{ w.sizeSqFt }} sq ft &middot; {{ w.type }} &middot;
                  {{ w.pricePerMonth | currency: 'INR' : 'symbol' : '1.0-0' }} / month
                </p>
                <p class="muted">Owner: {{ w.ownerName }} ({{ w.ownerEmail }})</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-flat-button [disabled]="busyId() === w.id" (click)="approve(w)">Approve</button>
                <button mat-button [disabled]="busyId() === w.id" (click)="reject(w)">Reject</button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page { padding: 24px 16px; max-width: 900px; margin: 0 auto; }
    .list { display: flex; flex-direction: column; gap: 16px; }
    .card { padding: 8px; }
    .muted { color: #78909c; }
    .error { color: #b3261e; }
  `,
})
export class AdminWarehouses {
  private service = inject(AdminService);

  items = signal<AdminWarehouse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  busyId = signal<number | null>(null);

  constructor() {
    this.service.getPending().subscribe({
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

  approve(w: AdminWarehouse): void {
    this.decide(w, this.service.approve(w.id));
  }

  reject(w: AdminWarehouse): void {
    if (!confirm(`Reject "${w.title}"?`)) return;
    this.decide(w, this.service.reject(w.id));
  }

  private decide(w: AdminWarehouse, request$: ReturnType<AdminService['approve']>): void {
    this.busyId.set(w.id);
    this.error.set(null);
    request$.subscribe({
      next: () => {
        this.items.update((list) => list.filter((x) => x.id !== w.id));
        this.busyId.set(null);
      },
      error: (e) => {
        this.error.set(extractError(e));
        this.busyId.set(null);
      },
    });
  }
}