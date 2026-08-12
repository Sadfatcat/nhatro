import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given roles. Requires the request already passed AuthGuard.
 *  Omit entirely to allow any authenticated user regardless of role. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
