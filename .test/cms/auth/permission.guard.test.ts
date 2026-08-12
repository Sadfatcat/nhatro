import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { permissionGuard } from '../../../apps/cms/src/app/core/permission/guards/permission.guard';
import { PermissionService } from '../../../apps/cms/src/app/core/permission/services/permission.service';
import { AuthService } from '../../../apps/cms/src/app/core/auth/services/auth.service';

@Component({ standalone: true, template: '' })
class BlankComponent {}

function setup(role: string | null, isAuthenticated: boolean) {
  TestBed.configureTestingModule({
    providers: [
      PermissionService,
      { provide: AuthService, useValue: { role: signal(role), isAuthenticated: signal(isAuthenticated) } },
      provideRouter([
        { path: 'protected', component: BlankComponent, canActivate: [permissionGuard], data: { permissions: ['accounts:landlords'] } },
        { path: 'open', component: BlankComponent, canActivate: [permissionGuard] },
        { path: 'login', component: BlankComponent },
        { path: 'unauthorized', component: BlankComponent },
      ]),
    ],
  });
}

describe('permissionGuard', () => {
  it('allows navigation when the route requires no permissions', async () => {
    setup('TENANT', true);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/open');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/open');
  });

  it('allows navigation when the authenticated role holds the required permission', async () => {
    setup('ADMIN', true);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/protected');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/protected');
  });

  it('redirects to /unauthorized when logged in but lacking the permission', async () => {
    setup('LANDLORD', true);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/protected');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/unauthorized');
  });

  it('redirects to /login when not authenticated at all', async () => {
    setup(null, false);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/protected');
    const router = TestBed.inject(Router);
    expect(router.url).toBe('/login');
  });
});
