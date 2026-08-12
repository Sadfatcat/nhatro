import 'reflect-metadata';
import { RoomsController } from '../../../apps/api/src/modules/rooms/rooms.controller';
import { ROLES_KEY } from '../../../apps/api/src/common/auth/roles.decorator';

describe('RoomsController — route role assignments (previously had NO auth check at all)', () => {
  it('the whole controller requires ADMIN or LANDLORD (class-level @Roles)', () => {
    expect(Reflect.getMetadata(ROLES_KEY, RoomsController)).toEqual(['ADMIN', 'LANDLORD']);
  });
});
