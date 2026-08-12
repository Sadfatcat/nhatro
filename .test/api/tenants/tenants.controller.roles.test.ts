import 'reflect-metadata';
import { TenantsController } from '../../../apps/api/src/modules/tenants/tenants.controller';
import { ROLES_KEY } from '../../../apps/api/src/common/auth/roles.decorator';

describe('TenantsController — route role assignments', () => {
  it('the whole controller requires ADMIN or LANDLORD', () => {
    expect(Reflect.getMetadata(ROLES_KEY, TenantsController)).toEqual(['ADMIN', 'LANDLORD']);
  });
});
