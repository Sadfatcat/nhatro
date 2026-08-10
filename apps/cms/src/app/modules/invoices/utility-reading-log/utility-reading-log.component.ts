import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig } from '../../../shared/components/display/data-table/data-table.model';
import { RoomWithUtility } from '@nhatro/shared-types';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

type ReadingRow = {
  roomId:     string;
  roomNumber: string;
  tenantName: string;
  elec:       { prev: number; curr: number } | null;
  water:      { prev: number; curr: number } | null;
  billingMonth: string | null;
  recordedAt:   string | null;
} & Record<string, unknown>;

@Component({
  selector:        'app-utility-reading-log',
  standalone:      true,
  templateUrl:     './utility-reading-log.component.html',
  styleUrls:       ['./utility-reading-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DataTableComponent],
})
export class UtilityReadingLogComponent implements OnInit {
  @ViewChild('elecTpl', { static: true }) elecTpl!: TemplateRef<unknown>;
  @ViewChild('waterTpl', { static: true }) waterTpl!: TemplateRef<unknown>;
  @ViewChild('recordedAtTpl', { static: true }) recordedAtTpl!: TemplateRef<unknown>;

  private api = inject(ApiService);

  loading = signal(false);
  items   = signal<ReadingRow[]>([]);

  get cellTemplates(): Record<string, TemplateRef<unknown>> {
    return { elec: this.elecTpl, water: this.waterTpl, recordedAt: this.recordedAtTpl };
  }

  get tableConfig(): TableConfig<ReadingRow> {
    return {
      rowKey:    'roomId',
      data:      this.items(),
      loading:   this.loading(),
      emptyText: 'Chưa có phòng nào đang thuê.',
      columns: [
        { key: 'roomNumber',   label: 'Phòng' },
        { key: 'tenantName',   label: 'Người thuê' },
        { key: 'elec',         label: 'Điện (kWh)' },
        { key: 'water',        label: 'Nước (m³)' },
        { key: 'billingMonth', label: 'Kỳ chốt' },
        { key: 'recordedAt',   label: 'Ngày chốt' },
      ],
    };
  }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.api.get<ApiResponse<RoomWithUtility[]>>('/utilities')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        const toNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
        this.items.set(res.data
          .filter(r => r.status === 'OCCUPIED')
          .map(r => ({
            roomId:       r.roomId,
            roomNumber:   r.roomNumber,
            tenantName:   r.tenant?.fullName ?? '—',
            elec:         r.utilityRecord ? { prev: r.utilityRecord.prevElec, curr: r.utilityRecord.currElec } : null,
            water:        r.utilityRecord ? { prev: r.utilityRecord.prevWater, curr: r.utilityRecord.currWater } : null,
            billingMonth: r.utilityRecord?.billingMonth ?? null,
            recordedAt:   r.utilityRecord?.recordedAt ?? null,
          }))
          .sort((a, b) => toNum(a.roomNumber) - toNum(b.roomNumber)));
      });
  }
}
