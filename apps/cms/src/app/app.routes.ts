import { Routes } from '@angular/router';
import { authGuard, defaultAppRouteGuard, noAuthGuard } from './core/auth/guards/auth.guard';
import { permissionGuard } from './core/permission/guards/permission.guard';
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
        canActivate:   [authGuard, permissionGuard],
        data:          { permissions: ['rooms:view'] },
        loadComponent: () => import('./modules/rooms/rooms-list/rooms-list.component').then(m => m.RoomsListComponent),
      },
      {
        path:          'tenants',
        canActivate:   [authGuard, permissionGuard],
        data:          { permissions: ['tenants:view'] },
        loadComponent: () => import('./modules/tenants/tenants-list/tenants-list.component').then(m => m.TenantsListComponent),
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
            path:          'invoices',
            canActivate:   [permissionGuard],
            data:          { permissions: ['invoices:manage'] },
            loadComponent: () => import('./modules/invoices/invoices-list/invoices-list.component').then(m => m.InvoicesListComponent),
          },
          {
            path:          'invoices/room/:roomId',
            canActivate:   [permissionGuard],
            data:          { permissions: ['invoices:view'] },
            loadComponent: () => import('./modules/invoices/invoice-room-history/invoice-room-history.component').then(m => m.InvoiceRoomHistoryComponent),
          },
          {
            path:          'invoices/merged/:id',
            canActivate:   [permissionGuard],
            data:          { permissions: ['invoices:view'] },
            loadComponent: () => import('./modules/invoices/merged-invoice-detail/merged-invoice-detail.component').then(m => m.MergedInvoiceDetailComponent),
          },
          {
            path:          'invoices/:id',
            canActivate:   [permissionGuard],
            data:          { permissions: ['invoices:view'] },
            loadComponent: () => import('./modules/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent),
          },
          {
            path:          'accounts/landlords',
            canActivate:   [permissionGuard],
            data:          { permissions: ['accounts:landlords'] },
            loadComponent: () => import('./modules/accounts/accounts.component').then(m => m.AccountsComponent),
          },
          { path: 'accounts',       redirectTo: 'accounts/landlords', pathMatch: 'full' },
          { path: 'accounts/rooms', redirectTo: 'accounts/landlords', pathMatch: 'full' },
          { path: 'account',        redirectTo: 'accounts/landlords', pathMatch: 'full' },
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
