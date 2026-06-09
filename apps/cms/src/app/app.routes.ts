import { Routes } from '@angular/router';
import { authGuard, defaultAppRouteGuard, noAuthGuard } from './core/auth/guards/auth.guard';
import { permissionGuard } from './core/auth/permission/guards/permission.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  // Auth routes
  {
    path:        '',
    component:   AuthLayoutComponent,
    canActivate: [noAuthGuard],
    children: [
      {
        path:          'login',
        loadComponent: () => import('./core/auth/login/login.component').then(m => m.LoginComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // App routes
  {
    path:      'app',
    component: MainLayoutComponent,
    children: [
      {
        path:          'rooms',
        canActivate:   [authGuard],
        loadComponent: () => import('./modules/rooms/rooms-list/rooms-list.component').then(m => m.RoomsListComponent),
      },

      // Protected routes — require authentication
      {
        path:        '',
        canActivate: [authGuard],
        children: [
          {
            path:          'home',
            canActivate:   [permissionGuard],
            data:          { permissions: ['home:view'] },
            loadComponent: () => import('./modules/home/tenant-home/tenant-home.component').then(m => m.TenantHomeComponent),
          },
          {
            path:          'management-home',
            canActivate:   [permissionGuard],
            data:          { permissions: ['management-home:view'] },
            loadComponent: () => import('./modules/home/management-home/management-home.component').then(m => m.ManagementHomeComponent),
          },
          {
            path:          'dashboard',
            canActivate:   [permissionGuard],
            data:          { permissions: ['dashboard:view'] },
            loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
          },
          {
            path:          'contracts',
            canActivate:   [permissionGuard],
            data:          { permissions: ['contracts:view'] },
            loadComponent: () => import('./modules/contracts/contracts.component').then(m => m.ContractsComponent),
          },
          {
            path:          'contracts/:id',
            canActivate:   [permissionGuard],
            data:          { permissions: ['contracts:view'] },
            loadComponent: () => import('./modules/contracts/contract-detail/contract-detail.component').then(m => m.ContractDetailComponent),
          },
          {
            path:          'accounts/rooms',
            canActivate:   [permissionGuard],
            data:          { permissions: ['accounts:rooms'] },
            loadComponent: () => import('./modules/accounts/accounts.component').then(m => m.AccountsComponent),
          },
          {
            path:          'accounts/landlords',
            canActivate:   [permissionGuard],
            data:          { permissions: ['accounts:landlords'] },
            loadComponent: () => import('./modules/accounts/accounts.component').then(m => m.AccountsComponent),
          },
          { path: 'accounts', redirectTo: 'accounts/rooms', pathMatch: 'full' },
          { path: 'account',  redirectTo: 'accounts/rooms', pathMatch: 'full' },
          { path: '', canActivate: [defaultAppRouteGuard], children: [] },
        ],
      },
    ],
  },

  // Special pages
  {
    path:          'unauthorized',
    loadComponent: () => import('./core/errors/unauthorized.component').then(m => m.UnauthorizedComponent),
  },
  { path: '403', redirectTo: '/unauthorized' },
  {
    path:          '404',
    loadComponent: () => import('./core/errors/page404.component').then(m => m.Page404Component),
  },
  { path: '**', redirectTo: '/404' },
];
