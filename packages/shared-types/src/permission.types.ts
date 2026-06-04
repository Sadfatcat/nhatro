export type Permission =
  | 'home:view'
  | 'management-home:view'
  | 'dashboard:view'
  | 'rooms:view'
  | 'rooms:create'
  | 'rooms:update'
  | 'rooms:delete'
  | 'rooms:view-public'
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
  | 'contracts:delete'
  | 'invoices:view'
  | 'invoices:create'
  | 'invoices:update'
  | 'invoices:mark-paid'
  | 'utilities:view'
  | 'utilities:create'
  | 'utilities:update'
  | 'accounts:view'
  | 'accounts:create';

export interface RoutePermissionData {
  permissions?: Permission[];
}
