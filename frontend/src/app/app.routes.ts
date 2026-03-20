import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/layout/dashboard-layout.component').then(
        (m) => m.DashboardLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/overview/overview.component').then(
            (m) => m.OverviewComponent
          ),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/dashboard/clientes/clientes.component').then(
            (m) => m.ClientesComponent
          ),
      },
      {
        path: 'sabores',
        loadComponent: () =>
          import('./features/dashboard/sabores/sabores.component').then(
            (m) => m.SaboresComponent
          ),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./features/dashboard/pedidos/pedidos.component').then(
            (m) => m.PedidosComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
