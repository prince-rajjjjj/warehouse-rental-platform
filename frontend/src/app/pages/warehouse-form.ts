import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { OwnerWarehouseService } from '../core/owner-warehouse.service';
import { WarehouseRequest, WarehouseType } from '../core/models';
import { extractError } from '../core/http-error';

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
              <input matInput formControlName="amenities" placeholder="Loading dock, CCTV, Power backup" />
            </mat-form-field>

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
    .page { display: flex; justify-content: center; padding: 24px 16px; }
    .card { width: 100%; max-width: 720px; padding: 16px; }
    form { display: flex; flex-direction: column; gap: 4px; margin-top: 16px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; }
    .error { color: #b3261e; margin: 0 0 8px; }
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

    const request$ = this.id === null ? this.service.create(body) : this.service.update(this.id, body);

    request$.subscribe({
      next: () => this.router.navigateByUrl('/owner'),
      error: (e) => {
        this.error.set(extractError(e));
        this.loading.set(false);
      },
    });
  }
}