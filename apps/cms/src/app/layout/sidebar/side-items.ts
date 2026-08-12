import { Permission } from '../../core/permission/policies/role-permissions';

export interface MenuItem {
  key:         string;
  label:       string;
  icon?:       string;
  route?:      string;
  permission?: Permission | Permission[];
  children?:   MenuItem[];
  divider?:    boolean;
}

export function canShowNavItem(
  item: MenuItem,
  allItems: MenuItem[],
  opts: { hasPermission: (p: Permission) => boolean; isAdmin: boolean; isTenant: boolean },
): boolean {
  if (item.divider) {
    const idx = allItems.indexOf(item);
    return allItems.slice(idx + 1).some(next => !next.divider && canShowNavItem(next, allItems, opts));
  }
  // Admin holds both home:view and management-home:view via ALL_PERMISSIONS.
  // The tenant-home entry point for Admin is the in-page toggle on
  // ManagementHomeComponent, not a second sidebar item.
  if (item.key === 'home' && opts.isAdmin) return false;
  // "Hóa đơn của tôi" only makes sense for a tenant's own room — ADMIN/LANDLORD
  // already have the management list (key 'invoices') and have no single roomId.
  if (item.key === 'invoices-tenant' && !opts.isTenant) return false;
  if (!item.permission) return true;
  const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
  return perms.every(p => opts.hasPermission(p));
}

export const NAV_ITEMS: MenuItem[] = [
  {
    key:        'management-home',
    label:      'Trang chủ - Quản lý',
    icon:       'home',
    route:      '/app/management-home',
    permission: 'management-home:view',
  },
  {
    key:        'home',
    label:      'Trang chủ',
    icon:       'home',
    route:      '/app/home',
    permission: 'home:view',
  },
  {
    key:        'dashboard',
    label:      'Dashboard',
    icon:       'fund-view',
    route:      '/app/dashboard',
    permission: 'dashboard:view',
  },
  {
    key:        'rooms',
    label:      'Phòng trọ',
    icon:       'environment',
    route:      '/app/rooms',
    permission: 'rooms:view',
  },
  {
    key:        'tenants',
    label:      'Người thuê',
    icon:       'team',
    route:      '/app/tenants',
    permission: 'tenants:view',
  },
  // {
  //   key:        'landlords',
  //   label:      'Chủ trọ',
  //   icon:       'user',
  //   route:      '/app/landlords',
  //   permission: 'landlords:view',
  // },
  {
    key:        'contracts',
    label:      'Hợp đồng',
    icon:       'file-text',
    route:      '/app/contracts',
    permission: 'contracts:view',
  },
  {
    key:        'invoices',
    label:      'Hóa đơn',
    icon:       'dollar',
    route:      '/app/invoices',
    permission: 'invoices:manage',
  },
  {
    key:        'invoices-tenant',
    label:      'Hóa đơn',
    icon:       'dollar',
    route:      '/app/invoices/room/:roomId',
    permission: 'invoices:view',
  },
  // {
  //   key:        'utilities',
  //   label:      'Điện nước',
  //   icon:       'thunderbolt',
  //   route:      '/app/utilities',
  //   permission: 'utilities:view',
  // },
  {
    key:      'divider-admin',
    label:    '',
    divider:  true,
  },
  {
    key:        'accounts-landlords',
    label:      'Tài khoản chủ nhà',
    icon:       'user',
    route:      '/app/accounts/landlords',
    permission: 'accounts:landlords',
  },
];
