import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../core/auth.service';
import { WarehouseService } from '../core/warehouse.service';
import { PublicWarehouse } from '../core/models';
import { extractError } from '../core/http-error';
import { BookingPanel } from './booking-panel';

@Component({
  selector: 'app-warehouse-details',
  imports: [CurrencyPipe, RouterLink, MatCardModule, MatButtonModule, BookingPanel],
  template: `
    <div class="page">
      <a mat-button routerLink="/">&larr; Back to search</a>

      @if (loading()) {
        <p>Loading...</p>
      } @else if (error()) {
        <p class="error">{{ error() }}</p>
      } @else if (w(); as w) {
        <h1>{{ w.title }}</h1>
        <p class="muted">{{ w.address }}, {{ w.city }}</p>

        @if (w.imageUrls.length > 0) {
          <div class="gallery">
            @for (url of w.imageUrls; track url) {
              <img [src]="url" [alt]="w.title" />
            }
          </div>
        } @else {
          <div class="placeholder">No photos yet</div>
        }

        <div class="layout">
          <div>
            <h2>About this warehouse</h2>
            <p class="description">{{ w.description }}</p>

            <h2>Details</h2>
            <ul>
              <li>Size: {{ w.sizeSqFt }} sq ft</li>
              <li>Type: {{ w.type }}</li>
              <li>Listed by: {{ w.ownerName }}</li>
            </ul>

            @if (amenities().length > 0) {
              <h2>Amenities</h2>
              <ul>
                @for (a of amenities(); track a) {
                  <li>{{ a }}</li>
                }
              </ul>
            }

            <h2>Reviews</h2>
            @if (w.averageRating !== null) {
              <p>{{ w.averageRating.toFixed(1) }} out of 5 ({{ w.reviewCount }} reviews)</p>
            } @else {
              <p class="muted">No reviews yet.</p>
            }
          </div>

          <mat-card class="booking">
            <mat-card-content>
              <p class="price">
                {{ w.pricePerMonth | currency: 'INR' : 'symbol' : '1.0-0' }} <span>/ month</span>
              </p>

              @if (auth.hasRole('Renter')) {
                <app-booking-panel [warehouseId]="w.id" [pricePerMonth]="w.pricePerMonth" />
              } @else if (auth.user()) {
                <p class="muted">
                  Only renter accounts can book. Log in with a renter account to reserve.
                </p>
              } @else {
                <a mat-flat-button routerLink="/login">Log in to book</a>
              }
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: `
    .page {
      padding: 24px 16px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .muted {
      color: #78909c;
    }
    .error {
      color: #b3261e;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 8px;
      margin: 16px 0;
    }
    .gallery img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
    }
    .placeholder {
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #eceff1;
      color: #78909c;
      border-radius: 8px;
      margin: 16px 0;
    }
    .layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 24px;
      align-items: start;
    }
    .description {
      white-space: pre-line;
    }
    .booking {
      position: sticky;
      top: 16px;
    }
    .price {
      font-size: 24px;
      font-weight: 600;
      margin-top: 0;
    }
    .price span {
      font-size: 14px;
      font-weight: 400;
      color: #78909c;
    }
    @media (max-width: 800px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class WarehouseDetails {
  private route = inject(ActivatedRoute);
  private service = inject(WarehouseService);
  auth = inject(AuthService);

  w = signal<PublicWarehouse | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  amenities() {
    const text = this.w()?.amenities;
    return text
      ? text
          .split(',')
          .map((a) => a.trim())
          .filter((a) => a)
      : [];
  }

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.service.getOne(id).subscribe({
      next: (r) => {
        this.w.set(r);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e?.status === 404 ? 'This warehouse was not found.' : extractError(e));
        this.loading.set(false);
      },
    });
  }
}
