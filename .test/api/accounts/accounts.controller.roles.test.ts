import 'reflect-metadata';
import { AccountsController } from '../../../apps/api/src/modules/accounts/accounts.controller';
import { ROLES_KEY } from '../../../apps/api/src/common/auth/roles.decorator';

describe('AccountsController — the most sensitive controller (role escalation), ADMIN-only', () => {
  it('the whole controller requires ADMIN — not even LANDLORD', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AccountsController)).toEqual(['ADMIN']);
  });
});
