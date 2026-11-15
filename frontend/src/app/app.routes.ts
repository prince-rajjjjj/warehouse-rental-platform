import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards';
import { Home } from './pages/home';
import { Login } from './pages/login';
import { Register } from './pages/register';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: '**', redirectTo: '' },
];