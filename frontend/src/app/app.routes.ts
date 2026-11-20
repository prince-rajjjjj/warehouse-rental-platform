import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';
import { Search } from './pages/search';
import { Login } from './pages/login';
import { Register } from './pages/register';
import { OwnerDashboard } from './pages/owner-dashboard';
import { WarehouseForm } from './pages/warehouse-form';

export const routes: Routes = [
  { path: '', component: Search},
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'owner', component: OwnerDashboard, canActivate: [authGuard, roleGuard('Owner')] },
  { path: 'owner/new', component: WarehouseForm, canActivate: [authGuard, roleGuard('Owner')] },
  { path: 'owner/:id/edit', component: WarehouseForm, canActivate: [authGuard, roleGuard('Owner')] },
  { path: '**', redirectTo: '' },
];