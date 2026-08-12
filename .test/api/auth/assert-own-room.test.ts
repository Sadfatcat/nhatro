import { ForbiddenException } from '@nestjs/common';
import { assertOwnRoomOrManagement } from '../../../apps/api/src/common/auth/assert-own-room';

describe('assertOwnRoomOrManagement — IDOR guard for tenant room-scoped reads', () => {
  it('allows ADMIN to query any room', () => {
    expect(() => assertOwnRoomOrManagement({ id: 'u1', role: 'ADMIN', roomId: undefined }, 'any-room-id'))
      .not.toThrow();
  });

  it('allows LANDLORD to query any room', () => {
    expect(() => assertOwnRoomOrManagement({ id: 'u1', role: 'LANDLORD', roomId: undefined }, 'any-room-id'))
      .not.toThrow();
  });

  it('allows a TENANT to query their own room', () => {
    expect(() => assertOwnRoomOrManagement({ id: 'u1', role: 'TENANT', roomId: 'room-1' }, 'room-1'))
      .not.toThrow();
  });

  it('rejects a TENANT querying a different room with 403', () => {
    expect(() => assertOwnRoomOrManagement({ id: 'u1', role: 'TENANT', roomId: 'room-1' }, 'room-2'))
      .toThrow(ForbiddenException);
  });

  it('rejects a TENANT with no room assigned from querying anything', () => {
    expect(() => assertOwnRoomOrManagement({ id: 'u1', role: 'TENANT', roomId: undefined }, 'room-1'))
      .toThrow(ForbiddenException);
  });
});
