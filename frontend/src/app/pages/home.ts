import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule],
  template: `
    <div class="page">
      <h1>Welcome, {{ auth.user()?.name }}</h1>
      <p>
        You are logged in as <strong>{{ auth.user()?.role }}</strong>.
      </p>
      <button mat-stroked-button (click)="auth.logout()">Log out</button>
    </div>
  `,
  styles: `
    .page {
      padding: 48px 16px;
      max-width: 720px;
      margin: 0 auto;
    }
  `,
})
export class Home {
  auth = inject(AuthService);
}
