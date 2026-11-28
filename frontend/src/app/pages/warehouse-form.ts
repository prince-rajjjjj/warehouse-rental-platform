import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OwnerWarehouseService } from '../core/owner-warehouse.service';
import { WarehouseRequest, WarehouseType, WarehouseImage } from '../core/models';
import { extractError } from '../core/http-error';
import { firstValueFrom } from 'rxjs';
import { ImageUrlPipe } from '../core/image-url.pipe';

@Component({
  selector: 'app-warehouse-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ImageUrlPipe,
  ],
  template: `
    <div class="page">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>{{ isEdit ? 'Edit warehouse' : 'Add warehouse' }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" />
              <mat-error>Title must be 5 to 200 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput rows="4" formControlName="description"></textarea>
              <mat-error>Description must be at least 20 characters</mat-error>
            </mat-form-field>

            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" />
                <mat-error>City is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type">
                  @for (t of types; track t) {
                    <mat-option [value]="t">{{ t }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Address</mat-label>
              <input matInput formControlName="address" />
              <mat-error>Address is required</mat-error>
            </mat-form-field>

            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Size (sq ft)</mat-label>
                <input matInput type="number" formControlName="sizeSqFt" />
                <mat-error>Enter a size of at least 1</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Price per month (INR)</mat-label>
                <input matInput type="number" formControlName="pricePerMonth" />
                <mat-error>Enter a price of at least 1</mat-error>
              </mat-form-field>
            </div>

            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>Latitude (optional)</mat-label>
                <input matInput type="number" formControlName="latitude" />
                <mat-error>Between -90 and 90</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Longitude (optional)</mat-label>
                <input matInput type="number" formControlName="longitude" />
                <mat-error>Between -180 and 180</mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Amenities (optional)</mat-label>
              <input
                matInput
                formControlName="amenities"
                placeholder="Loading dock, CCTV, Power backup"
              />
            </mat-form-field>

            @if (isEdit) {
              <div class="images">
                <h3>Photos</h3>
                <div class="thumbs">
                  @for (img of images(); track img.id) {
                    <div class="thumb">
                      <img [src]="img.url | imageUrl" alt="Warehouse photo" />
                      <span class="photo-status" [class]="'photo-status ' + img.status">{{
                        statusLabel(img.status)
                      }}</span>
                      <button type="button" mat-button (click)="removeImage(img)">Remove</button>
                    </div>
                  }
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  [disabled]="uploading()"
                  (change)="onFilesSelected($event)"
                />
                <p class="hint">
                  JPG, PNG or WebP, up to 5 MB each, up to 8 photos. New photos stay private until
                  you click
                  <strong>Save</strong>, and then an admin must approve them before anyone else can
                  see them.
                </p>
                @if (imageError()) {
                  <p class="error">{{ imageError() }}</p>
                }
              </div>
            } @else {
              <p class="hint">Save the warehouse first, then you can add photos.</p>
            }

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            <div class="actions">
              <a mat-button routerLink="/owner">Cancel</a>
              <button mat-flat-button type="submit" [disabled]="loading()">
                {{ loading() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .page {
      display: flex;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      width: 100%;
      max-width: 720px;
      padding: 16px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-top: 16px;
    }
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
    .error {
      color: #b3261e;
      margin: 0 0 8px;
    }
    .thumbs {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin: 8px 0;
    }
    .thumb img {
      width: 140px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      display: block;
    }
    .hint {
      color: #78909c;
      font-size: 12px;
    }
    .photo-status {
      display: block;
      margin-top: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .photo-status.Draft {
      color: #ff9800;
    }
    .photo-status.Pending {
      color: #2196f3;
    }
    .photo-status.Rejected {
      color: #f44336;
    }
    .photo-status.Approved {
      color: #4caf50;
    }
  `,
})
export class WarehouseForm implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(OwnerWarehouseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  id: number | null = null;
  types: WarehouseType[] = ['Dry', 'Cold', 'Mixed'];

  loading = signal(false);
  error = signal<string | null>(null);
  images = signal<WarehouseImage[]>([]);
  uploading = signal(false);
  imageError = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(4000)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    latitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    sizeSqFt: [null as number | null, [Validators.required, Validators.min(1)]],
    pricePerMonth: [null as number | null, [Validators.required, Validators.min(1)]],
    type: ['Dry' as WarehouseType, [Validators.required]],
    amenities: [''],
  });

  get isEdit(): boolean {
    return this.id !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;

    this.id = Number(idParam);
    this.loading.set(true);
    this.service.getOne(this.id).subscribe({
      next: (w) => {
        this.form.patchValue({
          title: w.title,
          description: w.description,
          city: w.city,
          address: w.address,
          latitude: w.latitude,
          longitude: w.longitude,
          sizeSqFt: w.sizeSqFt,
          pricePerMonth: w.pricePerMonth,
          type: w.type,
          amenities: w.amenities ?? '',
        });
        this.loading.set(false);
        this.images.set(w.images);
      },
      error: (e) => {
        this.error.set(extractError(e));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    const body: WarehouseRequest = {
      title: v.title.trim(),
      description: v.description.trim(),
      city: v.city.trim(),
      address: v.address.trim(),
      latitude: v.latitude,
      longitude: v.longitude,
      sizeSqFt: v.sizeSqFt!,
      pricePerMonth: v.pricePerMonth!,
      type: v.type,
      amenities: v.amenities.trim() || null,
    };

    const request$ =
      this.id === null ? this.service.create(body) : this.service.update(this.id, body);

    request$.subscribe({
      next: (w) => this.router.navigate(this.id === null ? ['/owner', w.id, 'edit'] : ['/owner']),
      error: (e) => {
        this.error.set(extractError(e));
        this.loading.set(false);
      },
    });
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // lets the same file be chosen again later
    if (this.id === null || files.length === 0) return;

    this.imageError.set(null);
    this.uploading.set(true);

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        this.imageError.set(`${file.name} is larger than 5 MB.`);
        break;
      }
      try {
        const img = await firstValueFrom(this.service.uploadImage(this.id, file));
        this.images.update((list) => [...list, img]);
      } catch (e) {
        this.imageError.set(`${file.name}: ${extractError(e)}`);
        break;
      }
    }

    this.uploading.set(false);
  }

  removeImage(img: WarehouseImage): void {
    if (this.id === null || !confirm('Remove this photo?')) return;
    this.imageError.set(null);
    this.service.deleteImage(this.id, img.id).subscribe({
      next: () => this.images.update((list) => list.filter((x) => x.id !== img.id)),
      error: (e) => this.imageError.set(extractError(e)),
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Draft':
        return 'Not submitted. Click Save to send for review';
      case 'Pending':
        return 'Waiting for admin approval';
      case 'Rejected':
        return 'Rejected by admin';
      default:
        return 'Approved and public';
    }
  }
}
