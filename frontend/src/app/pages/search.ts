import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { WarehouseService } from '../core/warehouse.service';
import { PublicWarehouse, WarehouseType } from '../core/models';
import { extractError } from '../core/http-error';
import { ImageUrlPipe } from '../core/image-url.pipe';

@Component({
  selector: 'app-search',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatPaginatorModule,
    ImageUrlPipe,
  ],
  template: `
    <div class="page">
      <h1>Find a warehouse</h1>

      <form class="filters" [formGroup]="form" (ngSubmit)="onSearch()">
        <mat-form-field appearance="outline">
          <mat-label>City</mat-label>
          <input matInput formControlName="city" placeholder="e.g. Ranchi" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="">Any</mat-option>
            <mat-option value="Dry">Dry</mat-option>
            <mat-option value="Cold">Cold</mat-option>
            <mat-option value="Mixed">Mixed</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Min price</mat-label>
          <input matInput type="number" formControlName="minPrice" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Max price</mat-label>
          <input matInput type="number" formControlName="maxPrice" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sort by</mat-label>
          <mat-select formControlName="sort">
            <mat-option value="newest">Newest</mat-option>
            <mat-option value="priceAsc">Price: low to high</mat-option>
            <mat-option value="priceDesc">Price: high to low</mat-option>
            <mat-option value="sizeDesc">Size: largest first</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="buttons">
          <button mat-flat-button type="submit">Search</button>
          <button mat-button type="button" (click)="onReset()">Reset</button>
        </div>
      </form>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p>Loading...</p>
      } @else if (items().length === 0) {
        <p>No warehouses found. Try changing the filters.</p>
      } @else {
        <p class="count">{{ total() }} warehouse{{ total() === 1 ? '' : 's' }} found</p>

        <div class="grid">
          @for (w of items(); track w.id) {
            <mat-card class="card">
              @if (w.imageUrls.length > 0) {
                <img
                  mat-card-image
                  class="card-image"
                  [src]="w.imageUrls[0] | imageUrl"
                  [alt]="w.title"
                />
              } @else {
                <div class="placeholder">No photo</div>
              }
              <mat-card-header>
                <mat-card-title>{{ w.title }}</mat-card-title>
                <mat-card-subtitle>{{ w.city }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ w.sizeSqFt }} sq ft &middot; {{ w.type }}</p>
                <p class="price">
                  {{ w.pricePerMonth | currency: 'INR' : 'symbol' : '1.0-0' }} / month
                </p>
                @if (w.averageRating !== null) {
                  <p>Rating: {{ w.averageRating.toFixed(1) }} ({{ w.reviewCount }})</p>
                } @else {
                  <p class="muted">No reviews yet</p>
                }
              </mat-card-content>
              <mat-card-actions>
                <a mat-button [routerLink]="['/warehouse', w.id]">View details</a>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="total()"
          [pageSize]="pageSize()"
          [pageIndex]="page() - 1"
          [pageSizeOptions]="[6, 12, 24]"
          (page)="onPage($event)"
        />
      }
    </div>
  `,
  styles: `
    .page {
      padding: 24px 16px;
      max-width: 1100px;
      margin: 0 auto;
    }
    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      align-items: start;
    }
    .buttons {
      display: flex;
      gap: 8px;
      align-items: center;
      height: 56px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }
    .card {
      padding-bottom: 8px;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }

    .card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
    }

    @media (prefers-reduced-motion: reduce) {
      .card {
        transition: none;
      }
      .card:hover {
        transform: none;
      }
    }
    .card-image {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
    }
    .placeholder {
      aspect-ratio: 16 / 10;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eceff1;
      color: #78909c;
    }
    mat-card-content {
      flex: 1;
    }
    .price {
      font-weight: 600;
    }
    .muted {
      color: #78909c;
    }
    .count {
      margin: 16px 0 0;
    }
    .error {
      color: #b3261e;
    }
  `,
})
export class Search {
  private fb = inject(FormBuilder);
  private service = inject(WarehouseService);

  items = signal<PublicWarehouse[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(12);
  loading = signal(true);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    city: [''],
    type: ['' as WarehouseType | ''],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
    sort: ['newest'],
  });

  constructor() {
    this.load();
  }

  onSearch(): void {
    this.page.set(1);
    this.load();
  }

  onReset(): void {
    this.form.reset();
    this.page.set(1);
    this.load();
  }

  onPage(e: PageEvent): void {
    this.page.set(e.pageIndex + 1);
    this.pageSize.set(e.pageSize);
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    this.service
      .search({
        city: v.city,
        type: v.type,
        minPrice: v.minPrice,
        maxPrice: v.maxPrice,
        sort: v.sort,
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (r) => {
          this.items.set(r.items);
          this.total.set(r.totalCount);
          this.loading.set(false);
        },
        error: (e) => {
          this.error.set(extractError(e));
          this.loading.set(false);
        },
      });
  }
}
