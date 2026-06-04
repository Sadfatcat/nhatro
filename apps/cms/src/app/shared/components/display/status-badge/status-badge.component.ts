import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { RoomStatus, ContractStatus, InvoiceStatus } from '@nhatro/shared-types';

type AnyStatus = RoomStatus | ContractStatus | InvoiceStatus;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  // Room status — Whispering Pines palette
  AVAILABLE:   { label: 'Còn trống',      color: '#345f56' },  // tertiary green
  OCCUPIED:    { label: 'Đang thuê',      color: '#1d6fa4' },  // strong blue
  MAINTENANCE: { label: 'Bảo trì',        color: '#b07b3e' },  // warning amber
  // Contract status
  ACTIVE:      { label: 'Hiệu lực',       color: '#345f56' },
  EXPIRED:     { label: 'Hết hạn',        color: '#74796e' },
  TERMINATED:  { label: 'Đã kết thúc',   color: '#ba1a1a' },
  // Invoice status
  UNPAID:      { label: 'Chưa thanh toán', color: '#b07b3e' },
  PAID:        { label: 'Đã thanh toán',   color: '#345f56' },
  OVERDUE:     { label: 'Quá hạn',         color: '#ba1a1a' },
};

@Component({
  selector:        'app-status-badge',
  standalone:      true,
  template:        `<nz-tag [nzColor]="config.color">{{ config.label }}</nz-tag>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [NzTagModule],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: AnyStatus;

  get config(): { label: string; color: string } {
    return STATUS_MAP[this.status] ?? { label: this.status, color: 'default' };
  }
}
