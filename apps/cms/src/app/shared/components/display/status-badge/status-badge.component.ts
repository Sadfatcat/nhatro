import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoomStatus, ContractStatus, InvoiceStatus } from '@nhatro/shared-types';

type AnyStatus = RoomStatus | ContractStatus | InvoiceStatus;

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  // Room status
  AVAILABLE:   { label: 'Còn trống',       cls: 'badge--gray'   },
  OCCUPIED:    { label: 'Đang thuê',       cls: 'badge--teal'   },
  MAINTENANCE: { label: 'Bảo trì',         cls: 'badge--danger' },
  // Contract status
  ACTIVE:      { label: 'Hiệu lực',        cls: 'badge--success' },
  EXPIRED:     { label: 'Hết hạn',         cls: 'badge--gray'    },
  TERMINATED:  { label: 'Đã kết thúc',    cls: 'badge--danger'  },
  // Invoice status
  SENT:        { label: 'Chưa thanh toán', cls: 'badge--danger'  },
  PAID:        { label: 'Đã thanh toán',   cls: 'badge--success' },
  OVERDUE:     { label: 'Quá hạn',         cls: 'badge--danger'  },
};

@Component({
  selector:        'app-status-badge',
  standalone:      true,
  template:        `<span class="badge" [class]="config.cls">{{ config.label }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: AnyStatus;

  get config(): { label: string; cls: string } {
    return STATUS_MAP[this.status] ?? { label: this.status, cls: 'badge--gray' };
  }
}
