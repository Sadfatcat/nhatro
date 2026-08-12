import { ForbiddenException } from '@nestjs/common';
import { RequestUser } from './jwt-payload.interface';

const MANAGEMENT_ROLES = ['ADMIN', 'LANDLORD'];

/** ADMIN/LANDLORD can query any room. A TENANT may only query their own room —
 *  prevents an authenticated tenant from reading another room's contract/invoice/utility data. */
export function assertOwnRoomOrManagement(user: RequestUser, roomId: string): void {
  if (MANAGEMENT_ROLES.includes(user.role)) return;
  if (user.roomId !== roomId) {
    throw new ForbiddenException('Bạn không có quyền xem dữ liệu của phòng này.');
  }
}
