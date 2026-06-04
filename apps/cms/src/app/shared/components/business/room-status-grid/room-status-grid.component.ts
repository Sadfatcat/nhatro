import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { Room, RoomStatus } from '@nhatro/shared-types';

const STATUS_STYLE: Record<RoomStatus, { bg: string; border: string; label: string }> = {
  AVAILABLE:   { bg: '#f6ffed', border: '#b7eb8f', label: 'Còn trống' },
  OCCUPIED:    { bg: '#e6f4ff', border: '#91caff', label: 'Đang thuê' },
  MAINTENANCE: { bg: '#fffbe6', border: '#ffe58f', label: 'Bảo trì' },
};

@Component({
  selector:        'app-room-status-grid',
  standalone:      true,
  templateUrl:     './room-status-grid.component.html',
  styleUrls:       ['./room-status-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzTooltipModule],
})
export class RoomStatusGridComponent {
  @Input({ required: true }) rooms!: Room[];
  @Input() selectable = false;
  @Input() selectedId?: string;

  @Output() roomClick = new EventEmitter<Room>();

  getStyle(status: RoomStatus): Record<string, string> {
    const s = STATUS_STYLE[status];
    return { background: s.bg, borderColor: s.border };
  }

  getLabel(status: RoomStatus): string {
    return STATUS_STYLE[status]?.label ?? status;
  }

  readonly legend = Object.entries(STATUS_STYLE).map(([key, val]) => ({
    status: key as RoomStatus,
    ...val,
  }));
}
