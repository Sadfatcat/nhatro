import { describe, it, expect } from 'vitest';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS } from '../../../apps/cms/src/app/core/permission/policies/role-permissions';
import { UserRole } from '@nhatro/shared-types';

describe('role-permissions policy', () => {
  it('ADMIN has every permission in the system', () => {
    expect(ROLE_PERMISSIONS[UserRole.ADMIN]).toEqual(ALL_PERMISSIONS);
  });

  it('TENANT cannot see any management-only permission', () => {
    const tenantPerms = ROLE_PERMISSIONS[UserRole.TENANT];
    const managementOnly = ['contracts:delete', 'rooms:delete', 'accounts:landlords', 'invoices:delete'];
    for (const perm of managementOnly) {
      expect(tenantPerms).not.toContain(perm);
    }
  });

  it('LANDLORD does not have "accounts:landlords" — only ADMIN manages landlord accounts', () => {
    expect(ROLE_PERMISSIONS[UserRole.LANDLORD]).not.toContain('accounts:landlords');
  });

  it('LANDLORD now has "contracts:delete" (granted per Đạt request — regression guard)', () => {
    expect(ROLE_PERMISSIONS[UserRole.LANDLORD]).toContain('contracts:delete');
  });

  it('every permission array contains no duplicate entries', () => {
    for (const role of Object.values(UserRole)) {
      const perms = ROLE_PERMISSIONS[role];
      expect(new Set(perms).size).toBe(perms.length);
    }
  });

  it('every permission assigned to a role actually exists in ALL_PERMISSIONS (no typo\'d perm strings)', () => {
    for (const role of Object.values(UserRole)) {
      for (const perm of ROLE_PERMISSIONS[role]) {
        expect(ALL_PERMISSIONS).toContain(perm);
      }
    }
  });
});
