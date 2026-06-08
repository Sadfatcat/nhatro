import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ROLE_PERMISSIONS } from '../policies/role-permissions';
import { Permission } from '../policies/role-permissions';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private auth = inject(AuthService);

  private permissions = computed(() => {
    const role = this.auth.role();
    return role ? (ROLE_PERMISSIONS[role] ?? []) : [];
  });

  hasPermission(permission: Permission | string): boolean {
    return this.permissions().includes(permission as Permission);
  }

  hasAnyPermission(...perms: Array<Permission | string>): boolean {
    return perms.some(p => this.hasPermission(p));
  }

  hasAllPermissions(...perms: Array<Permission | string>): boolean {
    return perms.every(p => this.hasPermission(p));
  }
}
