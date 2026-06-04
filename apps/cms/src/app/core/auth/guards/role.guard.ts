import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, _state) => {
  const auth     = inject(AuthService);
  const router   = inject(Router);
  const required = (route.data['roles'] as string[]) ?? [];

  if (required.length === 0 || required.some(r => auth.hasRole(r))) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
