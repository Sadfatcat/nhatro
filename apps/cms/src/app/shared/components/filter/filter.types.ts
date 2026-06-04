import { RoomStatus, ContractStatus, InvoiceStatus } from '@nhatro/shared-types';

export interface SelectFilterOption {
  label: string;
  value: unknown;
}

export interface DateRangeValue {
  from: Date | null;
  to:   Date | null;
}

export type PeriodPreset = 'this-month' | 'last-month' | 'this-quarter' | 'last-quarter' | 'this-year' | 'custom';

export type AnyStatus = RoomStatus | ContractStatus | InvoiceStatus;
