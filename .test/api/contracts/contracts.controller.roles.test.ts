import 'reflect-metadata';
import { ContractsController } from '../../../apps/api/src/modules/contracts/contracts.controller';
import { ROLES_KEY } from '../../../apps/api/src/common/auth/roles.decorator';

// Cheap regression guard: reads the @Roles() metadata directly off each handler,
// so a future edit that accidentally loosens/tightens a route's role gets caught here
// without needing to boot a full Nest app per route.
function rolesOf(method: string): string[] | undefined {
  return Reflect.getMetadata(ROLES_KEY, ContractsController.prototype[method as keyof ContractsController] as object);
}

describe('ContractsController — route role assignments', () => {
  it('findAll (management list view) requires ADMIN or LANDLORD', () => {
    expect(rolesOf('findAll')).toEqual(['ADMIN', 'LANDLORD']);
  });

  it('update (PATCH /:id) is ADMIN-only — matches the previous requireAdmin() behavior', () => {
    expect(rolesOf('update')).toEqual(['ADMIN']);
  });

  it('remove (DELETE /:id) allows ADMIN or LANDLORD — matches the "landlord can delete" grant', () => {
    expect(rolesOf('remove')).toEqual(['ADMIN', 'LANDLORD']);
  });

  it('findByRoom and findOne (tenant-facing reads) carry no @Roles() — any authenticated user', () => {
    expect(rolesOf('findByRoom')).toBeUndefined();
    expect(rolesOf('findOne')).toBeUndefined();
    expect(rolesOf('download')).toBeUndefined();
  });
});
