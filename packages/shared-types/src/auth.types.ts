export enum UserRole {
  ADMIN = 'ADMIN',
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT',
  GUEST = 'GUEST',
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Quản trị viên',
  [UserRole.LANDLORD]: 'Chủ trọ',
  [UserRole.TENANT]: 'Người thuê',
  [UserRole.GUEST]: 'Khách',
};

export interface MockUser {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  roomId?: string;
  createdAt: string;
}

export interface AuthState {
  user: MockUser | null;
  token: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  role: UserRole;
}

export interface LoginDto {
  identifier: string;
  password: string;
}
