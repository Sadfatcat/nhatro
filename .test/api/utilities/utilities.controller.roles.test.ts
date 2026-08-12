import 'reflect-metadata';
import { UtilitiesController } from '../../../apps/api/src/modules/utilities/utilities.controller';
import { ROLES_KEY } from '../../../apps/api/src/common/auth/roles.decorator';

function rolesOf(method: string): string[] | undefined {
  return Reflect.getMetadata(ROLES_KEY, UtilitiesController.prototype[method as keyof UtilitiesController] as object);
}

describe('UtilitiesController — route role assignments (previously had NO auth check at all)', () => {
  it('findAll/record/setBillingDay(Bulk) require ADMIN or LANDLORD', () => {
    expect(rolesOf('findAll')).toEqual(['ADMIN', 'LANDLORD']);
    expect(rolesOf('record')).toEqual(['ADMIN', 'LANDLORD']);
    expect(rolesOf('setBillingDayBulk')).toEqual(['ADMIN', 'LANDLORD']);
    expect(rolesOf('setBillingDay')).toEqual(['ADMIN', 'LANDLORD']);
  });

  it('findByRoom/history carry no @Roles() — tenant-home reads its own room this way', () => {
    expect(rolesOf('findByRoom')).toBeUndefined();
    expect(rolesOf('history')).toBeUndefined();
  });
});
