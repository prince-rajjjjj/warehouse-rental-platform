import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { OwnerWarehouseService } from '../core/owner-warehouse.service';
import { OwnerWarehouse } from '../core/models';
import { extractError } from '../core/http-error';

@Component({
  selector: 'app-owner-dashboard',
  imports: [RouterLink, CurrencyPipe, MatButtonModule, MatCardModule],
  template: `
    <div class="page">
      <div class="header">
        <h1>My warehouses</h1>
        <a mat-flat-button routerLink="/owner/new">Add warehouse</a>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p>Loading...</p>
      } @else if (items().length === 0) {
        <p>You haven't added any warehouses yet.</p>
      } @else {
        <div class="grid">
          @for (w of items(); track w.id) {
            <mat-card class="card">
              <mat-card-header>
                <mat-card-title>{{ w.title }}</mat-card-title>
                <mat-card-subtitle>{{ w.city }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>
                  <span
                    class="badge"
                    [class.pending]="w.status === 'Pending'"
                    [class.approved]="w.status === 'Approved'"
                    [class.rejected]="w.status === 'Rejected'"
                    >{{ w.status }}</span
                  >
                </p>
                <p>{{ w.sizeSqFt }} sq ft &middot; {{ w.type }}</p>
                <p>{{ w.pricePerMonth | currency: 'INR' : 'symbol' : '1.0-0' }} / month</p>
              </mat-card-content>
              <mat-card-actions>
                <a mat-button [routerLink]="['/owner', w.id, 'edit']">Edit</a>
                <button mat-button (click)="remove(w)">Delete</button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page { padding: 24px 16px; max-width: 1000px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .card { padding: 8px; }
    .error { color: #b3261e; }
    .badge { padding: 2px 10px; border-radius: 12px; font-size: 12px; background: #e0e0e0; }
    .badge.pending { background: #fff3cd; color: #7a5b00; }
    .badge.approved { background: #d4edda; color: #1d5b2e; }
    .badge.rejected { background: #f8d7da; color: #8a1c24; }
  `,
})
export class OwnerDashboard {
  private service = inject(OwnerWarehouseService);

  items = signal<OwnerWarehouse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
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

  remove(w: OwnerWarehouse): void {
    if (!confirm(`Delete "${w.title}"?`)) return;
    this.error.set(null);
    this.service.delete(w.id).subscribe({
      next: () => this.items.update((list) => list.filter((x) => x.id !== w.id)),
      error: (e) => this.error.set(extractError(e)),
    });
  }
}