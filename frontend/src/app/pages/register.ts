import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../core/auth.service';
import { extractError } from '../core/http-error';
import { UserRole } from '../core/models';

@Component({
  selector: 'app-register',
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
          <mat-card-title>Create account</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" autocomplete="name" />
              <mat-error>Name must be 2 to 100 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-error>Enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone (optional)</mat-label>
              <input matInput formControlName="phone" autocomplete="tel" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
              <mat-error>Password must be at least 8 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>I want to</mat-label>
              <mat-select formControlName="role">
                <mat-option value="Renter">Rent a warehouse</mat-option>
                <mat-option value="Owner">List my warehouse</mat-option>
              </mat-select>
            </mat-form-field>

            @if (error()) {
              <p class="error">{{ error() }}</p>
            }

            <button mat-flat-button type="submit" [disabled]="loading()">
              {{ loading() ? 'Creating...' : 'Create account' }}
            </button>
          </form>
          <p class="switch">Already registered? <a routerLink="/login">Log in</a></p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .page { display: flex; justify-content: center; padding: 48px 16px; }
    .card { width: 100%; max-width: 420px; padding: 16px; }
    form { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .error { color: #b3261e; margin: 0 0 8px; }
    .switch { margin-top: 16px; text-align: center; }
  `,
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['Renter' as UserRole, [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const v = this.form.getRawValue();
    this.auth
      .register({
        name: v.name,
        email: v.email,
        password: v.password,
        phone: v.phone.trim() ? v.phone.trim() : null,
        role: v.role,
      })
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (e) => {
          this.error.set(extractError(e));
          this.loading.set(false);
        },
      });
  }
}