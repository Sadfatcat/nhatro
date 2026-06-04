import { MockUser, UserRole } from '@nhatro/shared-types';

export const MOCK_USERS: MockUser[] = [
  {
    id: 'dev-admin-1',
    email: 'admin@nhatro.vn',
    password: 'admin123',
    fullName: 'Quản trị viên',
    role: UserRole.ADMIN,
    createdAt: '2026-05-25T00:00:00.000Z',
  },
];
