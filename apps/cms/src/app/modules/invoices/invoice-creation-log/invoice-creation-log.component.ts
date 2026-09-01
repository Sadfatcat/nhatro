import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig, PageChangeEvent, SortEvent } from '../../../shared/components/display/data-table/data-table.model';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { FilterPanelComponent } from '../../../shared/components/form/filter-panel/filter-panel.component';
import { FilterConfig, FilterValue } from '../../../shared/components/form/filter-panel/filter-panel.model';
import { Invoice } from '@nhatro/shared-types';

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
  kind:          'invoice' | 'merged';
} & Record<string, unknown>;

interface MergeSuggestion {
  tenantId:    string;
  tenantName:  string;
  totalAmount: number;
  invoices:    { id: string; roomNumber: string; totalAmount: number }[];
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
    CommonModule,
    NzButtonModule, NzIconModule, NzModalModule,
    DataTableComponent, StatusBadgeComponent, MoneyDisplayComponent, FilterPanelComponent,
  ],
})
export class InvoiceCreationLogComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<unknown>;
  @ViewChild('amountTpl', { static: true }) amountTpl!: TemplateRef<unknown>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<unknown>;

  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  private router = inject(Router);
  auth           = inject(AuthService);

  loading = signal(false);
  items   = signal<InvoiceLogRow[]>([]);
  total   = signal(0);
  page     = signal(1);
  pageSize = signal(10);

  filterPeriod   = signal<string | null>(null);
  filterRooms    = signal<string[] | null>(null);
  filterNotified = signal<string | null>(null);
  sortDir        = signal<'asc' | 'desc' | null>(null);

  onSortChange(event: SortEvent): void {
    this.sortDir.set(event.direction === 'ascend' ? 'asc' : event.direction === 'descend' ? 'desc' : null);
    this.loadData();
  }

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
        { key: 'roomNumber',  label: 'Phòng',      align: 'center', sortable: true },
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
    this.loadMergeSuggestions();
  }

  // ── Merge suggestions ──────────────────────────────────────────────────────
  mergeSuggestions = signal<MergeSuggestion[]>([]);
  merging          = signal<string | null>(null);
  mergeModalOpen   = signal(false);

  openMergeModal(): void {
    this.loadMergeSuggestions();
    this.mergeModalOpen.set(true);
  }

  closeMergeModal(): void { this.mergeModalOpen.set(false); }

  loadMergeSuggestions(): void {
    this.api.get<ApiResponse<MergeSuggestion[]>>('/invoices/merge-suggestions', { period: currentBillingPeriod() })
      .subscribe(res => {
        if (res.success && res.data) this.mergeSuggestions.set(res.data);
      });
  }

  mergeGroup(group: MergeSuggestion): void {
    this.merging.set(group.tenantId);
    this.api.post<ApiResponse<{ mergedInvoiceId: string }>>('/invoices/merge', { invoiceIds: group.invoices.map(i => i.id) })
      .pipe(finalize(() => this.merging.set(null)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success(`Đã gộp hoá đơn cho ${group.tenantName}.`);
        this.loadMergeSuggestions();
        this.loadData();
      });
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
    this.api.get<ApiResponse<{ items: InvoiceLogRow[]; total: number }>>('/invoices', {
      period:   this.filterPeriod(),
      roomIds:  this.filterRooms()?.length ? this.filterRooms()!.join(',') : null,
      notified,
      page:     this.page(),
      pageSize: this.pageSize(),
      sortBy:   this.sortDir() ? 'roomNumber' : null,
      sortDir:  this.sortDir(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.total.set(res.data.total);
        this.items.set(res.data.items);
      });
  }

  onRowClick(row: InvoiceLogRow): void {
    if (row.kind === 'merged') {
      this.router.navigateByUrl(`/app/invoices/merged/${row.id}`);
    } else {
      this.router.navigateByUrl(`/app/invoices/${row.id}`);
    }
  }
}
