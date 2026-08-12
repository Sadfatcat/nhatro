import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { PermissionService } from '../../../apps/cms/src/app/core/permission/services/permission.service';
import { AuthService } from '../../../apps/cms/src/app/core/auth/services/auth.service';

describe('PermissionService', () => {
  let role = signal<string | null>('TENANT');

  function setup(initialRole: string | null) {
    role = signal(initialRole);
    TestBed.configureTestingModule({
      providers: [
        PermissionService,
        { provide: AuthService, useValue: { role } },
      ],
    });
    return TestBed.inject(PermissionService);
  }

  it('a TENANT does not have contracts:delete', () => {
    const svc = setup('TENANT');
    expect(svc.hasPermission('contracts:delete')).toBe(false);
  });

  it('an ADMIN has contracts:delete', () => {
    const svc = setup('ADMIN');
    expect(svc.hasPermission('contracts:delete')).toBe(true);
  });

  it('reacts live when the underlying role signal changes (no stale cache)', () => {
    const svc = setup('TENANT');
    expect(svc.hasPermission('rooms:view')).toBe(false);
    role.set('LANDLORD');
    expect(svc.hasPermission('rooms:view')).toBe(true);
  });

  it('with no role (unauthenticated), every permission check is false', () => {
    const svc = setup(null);
    expect(svc.hasPermission('home:view')).toBe(false);
  });

  it('hasAnyPermission is true if at least one permission matches', () => {
    const svc = setup('TENANT');
    expect(svc.hasAnyPermission('contracts:delete', 'home:view')).toBe(true);
  });

  it('hasAllPermissions is false unless every permission matches', () => {
    const svc = setup('TENANT');
    expect(svc.hasAllPermissions('contracts:delete', 'home:view')).toBe(false);
    expect(svc.hasAllPermissions('home:view', 'contracts:view')).toBe(true);
  });
});
