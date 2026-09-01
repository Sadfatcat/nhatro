import 'reflect-metadata';
import { InvoicesController } from '../../../apps/api/src/modules/invoices/invoices.controller';
import { ROLES_KEY } from '../../../apps/api/src/common/auth/roles.decorator';

function rolesOf(method: string): string[] | undefined {
  return Reflect.getMetadata(ROLES_KEY, InvoicesController.prototype[method as keyof InvoicesController] as object);
}

describe('InvoicesController — route role assignments', () => {
  it('generate/markPaid/bulkMarkPaid/update/remove require ADMIN or LANDLORD', () => {
    expect(rolesOf('generate')).toEqual(['ADMIN', 'LANDLORD']);
    expect(rolesOf('markPaid')).toEqual(['ADMIN', 'LANDLORD']);
    expect(rolesOf('bulkMarkPaid')).toEqual(['ADMIN', 'LANDLORD']);
    expect(rolesOf('update')).toEqual(['ADMIN', 'LANDLORD']);
    expect(rolesOf('remove')).toEqual(['ADMIN', 'LANDLORD']);
  });

  it('findAll/findOne carry no @Roles() — any authenticated user (tenants read their own invoices)', () => {
    expect(rolesOf('findAll')).toBeUndefined();
    expect(rolesOf('findOne')).toBeUndefined();
  });
});
