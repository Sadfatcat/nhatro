export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE';

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  price: number;
  status: RoomStatus;
  billingDay: number;
  description?: string;
  branchId?: string;
}

export interface RoomWithUtility {
  roomId:       string;
  roomNumber:   string;
  floor:        number;
  price:        number;
  status:       RoomStatus;
  billingDay:   number;
  tenant:       { tenantId: string; fullName: string; username: string | null } | null;
  utilityRecord: UtilityReading | null;
}

export interface Tenant {
  id: string;
  fullName: string;
  phone: string;
  birthDate?: string;
  gender?: string;
}

export interface Contract {
  id: string;
  roomId: string;
  tenantId: string;
  startDate: string;
  endDate?: string;
  deposit: number;
  status: ContractStatus;
}

export interface Invoice {
  id: string;
  contractId: string;
  billingMonth: string;
  roomPrice: number;
  electricityPrice: number;
  waterPrice: number;
  totalAmount: number;
  status: InvoiceStatus;
  paidAt?: string;
}

export interface UtilityReading {
  id: string;
  roomId: string;
  billingMonth: string;
  prevElec: number;
  currElec: number;
  prevWater: number;
  currWater: number;
  recordedAt: string;
}

export interface UtilityPrices {
  electricityPerKwh: number;
  waterPerM3: number;
}
