import 'reflect-metadata';
import { NotificationsController } from '../../../apps/api/src/modules/notifications/notifications.controller';
import { ROLES_KEY } from '../../../apps/api/src/common/auth/roles.decorator';

describe('NotificationsController — route role assignments', () => {
  it('the whole controller requires ADMIN or LANDLORD', () => {
    expect(Reflect.getMetadata(ROLES_KEY, NotificationsController)).toEqual(['ADMIN', 'LANDLORD']);
  });
});
