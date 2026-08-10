import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { PermissionService } from '../services/permission.service';
import { Permission } from '../policies/role-permissions';

export const permissionGuard: CanActivateFn = (route, _state) => {
  const auth        = inject(AuthService);
  const permissions = inject(PermissionService);
  const router      = inject(Router);
  const required    = (route.data['permissions'] as Permission[]) ?? [];

  if (required.length === 0 || permissions.hasAllPermissions(...required)) {
    return true;
  }

  return auth.isAuthenticated()
    ? router.createUrlTree(['/unauthorized'])
    : router.createUrlTree(['/login']);
};
