import { Permission, UserRole } from '@nhatro/shared-types';

export const ALL_PERMISSIONS: Permission[] = [
  // Bảng điều khiển
  'dashboard:view',
  
  'home:view',

  // Phòng (rooms)
  'rooms:view',
  'rooms:create',
  'rooms:update',
  'rooms:delete',
  'rooms:view-public',

  // Người thuê (tenants)
  'tenants:view',
  'tenants:create',
  'tenants:update',
  'tenants:delete',

  // Chủ trọ (landlords)
  'landlords:view',
  'landlords:create',
  'landlords:update',
  'landlords:delete',

  // Hợp đồng (contracts)
  'contracts:view',
  'contracts:create',
  'contracts:update',
  'contracts:delete',

  // Hóa đơn (invoices)
  'invoices:view',
  'invoices:create',
  'invoices:update',
  'invoices:mark-paid',

  // Tiện ích (utilities)
  'utilities:view',
  'utilities:create',
  'utilities:update',

  // Tài khoản (accounts)
  'accounts:view',
  'accounts:create',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [
    'rooms:view-public',
  ],
  [UserRole.TENANT]: [
    'rooms:view',
    'contracts:view',
    'invoices:view',
    'home:view',
  ],
  [UserRole.LANDLORD]: [
    'rooms:view',
    'rooms:create',
    'rooms:update',
    'tenants:view',
    'tenants:create',
    'tenants:update',
    'contracts:view',
    'contracts:create',
    'contracts:update',
    'invoices:view',
    'invoices:create',
    'invoices:update',
    'invoices:mark-paid',
    'utilities:view',
    'utilities:create',
    'utilities:update',
    'accounts:create',
  ],
  [UserRole.ADMIN]: ALL_PERMISSIONS,
};
