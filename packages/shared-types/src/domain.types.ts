export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
export type ContractStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
export type InvoiceStatus = 'SENT' | 'PAID' | 'OVERDUE';

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
  deposit: number;
  status: ContractStatus;
  filePath?: string;
}

export interface InvoiceBankInfo {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
}

export interface Invoice {
  id: string;
  roomId: string;
  contractId: string;
  period: string;
  rentAmount: number;
  electricityAmount: number;
  waterAmount: number;
  otherFees: number;
  totalAmount: number;
  prevElec: number;
  currElec: number;
  prevWater: number;
  currWater: number;
  elecUnitPrice: number;
  waterUnitPrice: number;
  referenceCode: string;
  dueDate: string;
  status: InvoiceStatus;
  paidAt: string | null;
  markedBy: string | null;
  createdAt: string;
  updatedAt: string;
  room: { roomNumber: string; floor: number };
  bankInfo?: InvoiceBankInfo;
  notificationLogs?: NotificationLog[];
}

export interface NotificationLog {
  id: string;
  invoiceId: string;
  templateKey: string;
  channel: string;
  success: boolean;
  reason: string | null;
  sentAt: string;
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

export interface UtilityHistoryPoint {
  billingMonth: string;
  prevElec: number;
  currElec: number;
  prevWater: number;
  currWater: number;
  elecUsed: number;
  waterUsed: number;
  recordedAt: string | null;
}

export interface UtilityPrices {
  electricityPerKwh: number;
  waterPerM3: number;
}
