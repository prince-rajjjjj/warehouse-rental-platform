import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar>
      <a routerLink="/" class="brand">Warehouse Rental</a>
      <span class="spacer"></span>
      @if (auth.user(); as user) {
        @if (user.role === 'Owner') {
          <a mat-button routerLink="/owner">My warehouses</a>
        }
        <span class="hello">{{ user.name }}</span>
        <button mat-button (click)="auth.logout()">Log out</button>
      } @else {
        <a mat-button routerLink="/login">Log in</a>
        <a mat-button routerLink="/register">Register</a>
      }
    </mat-toolbar>
    <router-outlet />
  `,
  styles: `
    .brand { font-weight: 600; text-decoration: none; color: inherit; }
    .spacer { flex: 1; }
    .hello { margin-right: 8px; }
  `,
})
export class App {
  auth = inject(AuthService);
}