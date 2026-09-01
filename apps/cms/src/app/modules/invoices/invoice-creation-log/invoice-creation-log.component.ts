import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig, PageChangeEvent } from '../../../shared/components/display/data-table/data-table.model';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { FilterPanelComponent } from '../../../shared/components/form/filter-panel/filter-panel.component';
import { FilterConfig, FilterValue } from '../../../shared/components/form/filter-panel/filter-panel.model';
import { Invoice, RoomWithUtility } from '@nhatro/shared-types';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

type InvoiceLogRow = {
  id:            string;
  roomNumber:    string;
  tenantName:    string;
  period:        string;
  totalAmount:   number;
  status:        Invoice['status'];
  createdAt:     string;
  dueDate:       string;
  notified:      boolean;
} & Record<string, unknown>;

interface GenerateResult {
  created: unknown[];
  skipped: { roomId: string; roomNumber: string; reason: string }[];
}

function currentBillingPeriod(): string {
  const d = new Date();
  const dt = new Date(d.getFullYear(), d.getDate() <= 10 ? d.getMonth() - 1 : d.getMonth(), 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function lastNBillingPeriods(n: number): string[] {
  const out: string[] = [];
  const base = currentBillingPeriod();
  const [y, m] = base.split('-').map(Number);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(y, m - 1 - i, 1);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

@Component({
  selector:        'app-invoice-creation-log',
  standalone:      true,
  templateUrl:     './invoice-creation-log.component.html',
  styleUrls:       ['./invoice-creation-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzModalModule, NzSelectModule,
    DataTableComponent, StatusBadgeComponent, MoneyDisplayComponent, FilterPanelComponent, PermissionDirective,
  ],
})
export class InvoiceCreationLogComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<unknown>;
  @ViewChild('amountTpl', { static: true }) amountTpl!: TemplateRef<unknown>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<unknown>;

  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  loading = signal(false);
  items   = signal<InvoiceLogRow[]>([]);
  total   = signal(0);
  page     = signal(1);
  pageSize = signal(10);

  filterPeriod   = signal<string | null>(null);
  filterRooms    = signal<string[] | null>(null);
  filterNotified = signal<string | null>(null);

  periodOptions = computed(() => lastNBillingPeriods(12).reverse().map(p => ({ label: `Kỳ ${p}`, value: p })));

  roomOptions = signal<{ label: string; value: string }[]>([]);

  filterConfig = computed<FilterConfig>(() => ({
    fields: [
      { key: 'period',   label: 'Kỳ',     type: 'select',      options: this.periodOptions(), span: 6 },
      { key: 'roomIds',  label: 'Phòng',   type: 'multiselect', options: this.roomOptions(),    span: 10 },
      { key: 'notified', label: 'Đã gửi', type: 'select', span: 6, options: [
        { label: 'Đã gửi',  value: 'yes' },
        { label: 'Chưa gửi', value: 'no' },
      ] },
    ],
    autoSearch: true,
    debounceMs: 0,
  }));

  onFilterChange(value: FilterValue): void {
    this.filterPeriod.set((value['period'] as string) ?? null);
    this.filterRooms.set((value['roomIds'] as string[]) ?? null);
    this.filterNotified.set((value['notified'] as string) ?? null);
    this.page.set(1);
    this.loadData();
  }

  onPageChange(event: PageChangeEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadData();
  }

  get cellTemplates(): Record<string, TemplateRef<unknown>> {
    return { status: this.statusTpl, totalAmount: this.amountTpl, createdAt: this.dateTpl, dueDate: this.dateTpl };
  }

  get tableConfig(): TableConfig<InvoiceLogRow> {
    return {
      rowKey:    'id',
      data:      this.items(),
      loading:   this.loading(),
      emptyText: 'Chưa có hoá đơn nào được tạo.',
      pagination: {
        page:      this.page(),
        pageSize:  this.pageSize(),
        total:     this.total(),
        showTotal: true,
      },
      columns: [
        { key: 'roomNumber',  label: 'Phòng',      align: 'center' },
        { key: 'tenantName',  label: 'Người thuê', align: 'center' },
        { key: 'period',      label: 'Kỳ',         align: 'center' },
        { key: 'totalAmount', label: 'Tổng tiền',  align: 'center' },
        { key: 'status',      label: 'Trạng thái', align: 'center' },
        { key: 'createdAt',   label: 'Ngày tạo',   align: 'center' },
        { key: 'dueDate',     label: 'Hạn đóng',   align: 'center' },
      ],
    };
  }

  ngOnInit(): void {
    this.loadRoomOptions();
    this.loadData();
  }

  loadRoomOptions(): void {
    this.api.get<ApiResponse<{ id: string; roomNumber: string }[]>>('/rooms')
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.roomOptions.set(res.data
          .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true }))
          .map(r => ({ label: r.roomNumber, value: r.id })));
      });
  }

  loadData(): void {
    this.loading.set(true);
    const notified = this.filterNotified() === 'yes' ? 'true' : this.filterNotified() === 'no' ? 'false' : null;
    this.api.get<ApiResponse<{
      items: (Invoice & { room: { roomNumber: string }; contract: { tenant: { fullName: string } }; _count: { notificationLogs: number } })[];
      total: number;
    }>>('/invoices', {
      period:   this.filterPeriod(),
      roomIds:  this.filterRooms()?.length ? this.filterRooms()!.join(',') : null,
      notified,
      page:     this.page(),
      pageSize: this.pageSize(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.total.set(res.data.total);
        this.items.set(res.data.items.map(inv => ({
          id:          inv.id,
          roomNumber:  inv.room.roomNumber,
          tenantName:  inv.contract.tenant.fullName,
          period:      inv.period,
          totalAmount: inv.totalAmount,
          status:      inv.status,
          createdAt:   inv.createdAt,
          dueDate:     inv.dueDate,
          notified:    inv._count.notificationLogs > 0,
        })));
      });
  }

  onRowClick(row: InvoiceLogRow): void {
    this.router.navigateByUrl(`/app/invoices/${row.id}`);
  }

  // ── Bulk generate ──────────────────────────────────────────────────────────
  generateModalOpen = signal(false);
  generateSaving    = signal(false);
  generatePeriod    = signal(currentBillingPeriod());
  generateRoomIds   = signal<string[]>([]);
  generateRooms     = signal<{ roomId: string; roomNumber: string }[]>([]);
  generateResult    = signal<GenerateResult | null>(null);

  openGenerateModal(): void {
    this.generateResult.set(null);
    this.generateRoomIds.set([]);
    this.generatePeriod.set(currentBillingPeriod());
    this.generateModalOpen.set(true);
    this.loadGenerateRooms();
  }

  closeGenerateModal(): void { this.generateModalOpen.set(false); }

  private loadGenerateRooms(): void {
    this.api.get<ApiResponse<RoomWithUtility[]>>('/utilities')
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.generateRooms.set(res.data
          .filter(r => r.status === 'OCCUPIED' && r.utilityRecord)
          .map(r => ({ roomId: r.roomId, roomNumber: r.roomNumber }))
          .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true })));
      });
  }

  submitGenerate(): void {
    const roomIds = this.generateRoomIds();
    if (roomIds.length === 0) {
      this.toast.error('Chọn ít nhất một phòng.');
      return;
    }
    this.generateSaving.set(true);
    this.api.post<ApiResponse<GenerateResult>>('/invoices/generate', { period: this.generatePeriod(), roomIds })
      .pipe(finalize(() => this.generateSaving.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.generateResult.set(res.data);
        this.toast.success(`Đã sinh ${res.data.created.length} hoá đơn, bỏ qua ${res.data.skipped.length} phòng.`);
        this.loadData();
      });
  }
}
