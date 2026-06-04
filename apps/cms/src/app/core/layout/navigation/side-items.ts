import { Permission } from '../../auth/permission/policies/role-permissions';

export interface MenuItem {
  key:         string;
  label:       string;
  icon?:       string;
  route?:      string;
  permission?: Permission | Permission[];
  children?:   MenuItem[];
  divider?:    boolean;
}

export const NAV_ITEMS: MenuItem[] = [
  {
    key:        'management-home',
    label:      'Trang chủ',
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
  {
    key:        'landlords',
    label:      'Chủ trọ',
    icon:       'user',
    route:      '/app/landlords',
    permission: 'landlords:view',
  },
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
    permission: 'invoices:view',
  },
  {
    key:        'utilities',
    label:      'Điện nước',
    icon:       'thunderbolt',
    route:      '/app/utilities',
    permission: 'utilities:view',
  },
  {
    key:      'divider-admin',
    label:    '',
    divider:  true,
  },
  {
    key:        'accounts-rooms',
    label:      'Tài khoản phòng',
    icon:       'setting',
    route:      '/app/accounts/rooms',
    permission: 'accounts:rooms',
  },
  {
    key:        'accounts-landlords',
    label:      'Tài khoản chủ nhà',
    icon:       'user',
    route:      '/app/accounts/landlords',
    permission: 'accounts:landlords',
  },
];
