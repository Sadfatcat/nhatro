import { UserRole } from '../../auth/auth.types';

// ── Permission type ───────────────────────────────────────────────────────────
// Add new permissions here, then assign them to roles below.
export type Permission =
  | 'home:view'
  | 'management-home:view'
  | 'dashboard:view'
  | 'rooms:view'
  | 'rooms:create'
  | 'rooms:update'
  | 'rooms:delete'
  | 'tenants:view'
  | 'tenants:create'
  | 'tenants:update'
  | 'tenants:delete'
  | 'landlords:view'
  | 'landlords:create'
  | 'landlords:update'
  | 'landlords:delete'
  | 'contracts:view'
  | 'contracts:create'
  | 'contracts:update'
  | 'contracts:update-fields'
  | 'contracts:upload'
  | 'contracts:delete'
  | 'invoices:view'
  | 'invoices:create'
  | 'invoices:update'
  | 'invoices:mark-paid'
  | 'invoices:notify'
  | 'invoices:delete'
  | 'utilities:view'
  | 'utilities:create'
  | 'utilities:update'
  | 'accounts:view'
  | 'accounts:create'
  | 'accounts:landlords'
  | 'utilities:record'
  | 'utilities:set-billing-day';

export interface RoutePermissionData {
  permissions?: Permission[];
}

// ── Permission lists ──────────────────────────────────────────────────────────
export const ALL_PERMISSIONS: Permission[] = [
  'home:view',
  'management-home:view',
  'dashboard:view',
  'rooms:view',
  'rooms:create',
  'rooms:update',
  'rooms:delete',
  'tenants:view',
  'tenants:create',
  'tenants:update',
  'tenants:delete',
  'landlords:view',
  'landlords:create',
  'landlords:update',
  'landlords:delete',
  'contracts:view',
  'contracts:create',
  'contracts:update',
  'contracts:update-fields',
  'contracts:upload',
  'contracts:delete',
  'invoices:view',
  'invoices:create',
  'invoices:update',
  'invoices:mark-paid',
  'invoices:notify',
  'invoices:delete',
  'utilities:view',
  'utilities:create',
  'utilities:update',
  'accounts:view',
  'accounts:create',
  'accounts:landlords',
  'utilities:record',
  'utilities:set-billing-day',
];

// ── Role assignments ──────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.TENANT]: [
    'home:view',
    'contracts:view',
    'invoices:view',
    'utilities:view',
  ],
  [UserRole.LANDLORD]: [
    'management-home:view',
    'rooms:view',
    'rooms:create',
    'rooms:update',
    'tenants:view',
    'tenants:create',
    'tenants:update',
    'contracts:view',
    'contracts:create',
    'contracts:update',
    'contracts:upload',
    'invoices:view',
    'invoices:create',
    'invoices:update',
    'invoices:mark-paid',
    'invoices:notify',
    'invoices:delete',
    'utilities:view',
    'utilities:create',
    'utilities:update',
    'accounts:view',
    'accounts:create',
    'dashboard:view',
    'utilities:record',
    'utilities:set-billing-day',
  ],
  [UserRole.ADMIN]: ALL_PERMISSIONS,
};
