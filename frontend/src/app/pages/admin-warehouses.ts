import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';
import { AdminService } from '../core/admin.service';
import { ImageUrlPipe } from '../core/image-url.pipe';
import { AdminWarehouse } from '../core/models';
import { extractError } from '../core/http-error';

@Component({
  selector: 'app-admin-warehouses',
  imports: [CurrencyPipe, ImageUrlPipe, MatCardModule, MatButtonModule],
  template: `
    <div class="page">
      <h1>Waiting for review</h1>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      @if (loading()) {
        <p>Loading...</p>
      } @else if (items().length === 0) {
        <p>Nothing is waiting for review.</p>
      } @else {
        <div class="list">
          @for (w of items(); track w.id) {
            <mat-card class="card">
              <mat-card-header>
                <mat-card-title>{{ w.title }}</mat-card-title>
                <mat-card-subtitle>{{ w.address }}, {{ w.city }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>
                  <span class="tag" [class.listing]="w.listingNeedsReview">
                    {{ w.listingNeedsReview ? 'New or changed listing' : 'New photos only' }}
                  </span>
                </p>
                <p>{{ w.description }}</p>
                <p>
                  {{ w.sizeSqFt }} sq ft &middot; {{ w.type }} &middot;
                  {{ w.pricePerMonth | currency: 'INR' : 'symbol' : '1.0-0' }} / month
                </p>
                @if (w.amenities) {
                  <p>Amenities: {{ w.amenities }}</p>
                }
                <p class="muted">Owner: {{ w.ownerName }} ({{ w.ownerEmail }})</p>

                @if (w.imageUrls.length > 0) {
                  <h4>Photos already public</h4>
                  <div class="thumbs">
                    @for (url of w.imageUrls; track url) {
                      <img [src]="url | imageUrl" alt="Approved photo" />
                    }
                  </div>
                }

                <h4>New photos to review</h4>
                @if (w.pendingImages.length === 0) {
                  <p class="muted">No new photos.</p>
                } @else {
                  <div class="thumbs">
                    @for (img of w.pendingImages; track img.id) {
                      <div class="thumb">
                        <a [href]="img.url | imageUrl" target="_blank" rel="noopener">
                          <img [src]="img.url | imageUrl" alt="Photo to review" />
                        </a>
                        <button mat-button [disabled]="busy()" (click)="rejectPhoto(img.id)">
                          Reject photo
                        </button>
                      </div>
                    }
                  </div>
                }
              </mat-card-content>
              <mat-card-actions>
                <button mat-flat-button [disabled]="busy()" (click)="decide(w, true)">
                  {{ w.listingNeedsReview ? 'Approve' : 'Approve photos' }}
                </button>
                <button mat-button [disabled]="busy()" (click)="decide(w, false)">
                  {{ w.listingNeedsReview ? 'Reject' : 'Reject all photos' }}
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .page {
      padding: 24px 16px;
      max-width: 900px;
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
    .muted {
      color: #78909c;
    }
    .error {
      color: #b3261e;
    }
    h4 {
      margin: 16px 0 8px;
    }
    .tag {
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      background: #e3f2fd;
      color: #0d47a1;
    }
    .tag.listing {
      background: #fff3cd;
      color: #7a5b00;
    }
    .thumbs {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .thumb {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    img {
      width: 180px;
      height: 130px;
      object-fit: cover;
      border-radius: 8px;
      display: block;
    }
  `,
})
export class AdminWarehouses {
  private service = inject(AdminService);

  items = signal<AdminWarehouse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  busy = signal(false);

  constructor() {
    this.load();
  }

  decide(w: AdminWarehouse, approve: boolean): void {
    if (!approve && !confirm(`Reject "${w.title}"?`)) return;
    this.run(approve ? this.service.approve(w.id) : this.service.reject(w.id));
  }

  rejectPhoto(imageId: number): void {
    if (!confirm('Reject this photo?')) return;
    this.run(this.service.rejectImage(imageId));
  }

  // Runs a decision, then reloads the list so the screen shows what the server says.
  private run(request$: Observable<unknown>): void {
    this.busy.set(true);
    this.error.set(null);
    request$.subscribe({
      next: () => {
        this.busy.set(false);
        this.load();
      },
      error: (e) => {
        this.error.set(extractError(e));
        this.busy.set(false);
        this.load();
      },
    });
  }

  private load(): void {
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
}
