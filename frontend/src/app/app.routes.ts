import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { Home } from './pages/home';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { OwnerDashboard } from './pages/owner-dashboard';
import { WarehouseForm } from './pages/warehouse-form';

export const routes: Routes = [
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'owner', component: OwnerDashboard, canActivate: [authGuard, roleGuard('Owner')] },
  { path: 'owner/new', component: WarehouseForm, canActivate: [authGuard, roleGuard('Owner')] },
  { path: 'owner/:id/edit', component: WarehouseForm, canActivate: [authGuard, roleGuard('Owner')] },
  { path: '**', redirectTo: '' },
];