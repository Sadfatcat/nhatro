import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { filter, finalize } from 'rxjs';
import { lastNBillingPeriods } from '../../../shared/utils/billing-period';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { ConfirmDialogService } from '../../../shared/components/feedback/confirm-dialog/confirm-dialog.service';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig } from '../../../shared/components/display/data-table/data-table.model';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { FilterPanelComponent } from '../../../shared/components/form/filter-panel/filter-panel.component';
import { FilterConfig, FilterValue } from '../../../shared/components/form/filter-panel/filter-panel.model';
import { ApiResponse, InvoiceStatus } from '@nhatro/shared-types';

type BatchRoomRow = {
  roomId:          string;
  roomNumber:      string;
  tenantName:      string | null;
  invoiceId:       string | null;
  invoiceStatus:   InvoiceStatus | null;
  totalAmount:     number | null;
  dueDate:         string | null;
  mergedInvoiceId: string | null;
  sent:            boolean;
  lastFailReason:  string | null;
} & Record<string, unknown>;

interface ClosingBatch {
  id:       string;
  period:   string;
  closedAt: string;
  rooms:    BatchRoomRow[];
}

interface BatchView {
  id:           string;
  closedAt:     string;
  periodLabel:  string;
  unsentRows:   BatchRoomRow[];
  sendableUnsentCount: number;
  sentRows:     BatchRoomRow[];
  mergedRows:   BatchRoomRow[];
  unsentConfig: TableConfig<BatchRoomRow>;
  sentConfig:   TableConfig<BatchRoomRow>;
  mergedConfig: TableConfig<BatchRoomRow>;
}

type BulkSendResult = { sent: number; failed: { invoiceId: string; reason: string }[] };

const BATCHES_PER_PAGE = 5;
const MAX_BATCHES      = 50;

@Component({
  selector:        'app-invoices-by-billing-day',
  standalone:      true,
  templateUrl:     './invoices-by-billing-day.component.html',
  styleUrls:       ['./invoices-by-billing-day.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers:       [ConfirmDialogService], // needs the NzModalService provided by NzModalModule
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzCheckboxModule, NzModalModule,
    DataTableComponent, StatusBadgeComponent, MoneyDisplayComponent, PermissionDirective, FilterPanelComponent,
  ],
})
export class InvoicesByBillingDayComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<unknown>;
  @ViewChild('amountTpl', { static: true }) amountTpl!: TemplateRef<unknown>;
  @ViewChild('dueDateTpl', { static: true }) dueDateTpl!: TemplateRef<unknown>;

  private api           = inject(ApiService);
  private toast         = inject(ToastService);
  private router        = inject(Router);
  private confirmDialog = inject(ConfirmDialogService);

  loading = signal(false);
  saving  = signal(false);

  cellTemplates!: Record<string, TemplateRef<unknown>>;

  filterConfig: FilterConfig = {
    fields: [{
      key: 'period', label: 'Kỳ', type: 'select', span: 6,
      options: lastNBillingPeriods(12).reverse().map(p => ({ label: `Kỳ ${this.toPeriodLabel(p)}`, value: p })),
    }],
    autoSearch: true,
    debounceMs: 0,
    storageKey: 'closing-batches',
  };

  private filterPeriod      = signal<string | null>(null);
  private visibleBatchCount = signal(BATCHES_PER_PAGE);

  batches      = signal<ClosingBatch[]>([]);
  totalBatches = signal(0);
  canLoadMore  = computed(() => this.batches().length < this.totalBatches() && this.visibleBatchCount() < MAX_BATCHES);

  /** Selected rows per batch id. Cleared whenever batches are reloaded. */
  private selectedByBatchId = signal<Record<string, BatchRoomRow[]>>({});

  // Table configs are built once per load: a config with a new `data` array resets the table's row selection.
  batchViews = computed<BatchView[]>(() => this.batches().map(batch => {
    const rooms      = batch.rooms;
    const mergedRows = rooms.filter(r => r.mergedInvoiceId);
    const unsentRows = rooms.filter(r => !r.mergedInvoiceId && !r.sent);
    const sentRows   = rooms.filter(r => !r.mergedInvoiceId && r.sent);
    return {
      id:          batch.id,
      closedAt:    batch.closedAt,
      periodLabel: this.toPeriodLabel(batch.period),
      unsentRows, sentRows, mergedRows,
      sendableUnsentCount: unsentRows.filter(r => r.invoiceId).length,
      unsentConfig: this.buildTableConfig(unsentRows, { selectable: true,  showFailReason: true,  emptyText: 'Tất cả phòng đã được gửi.' }),
      sentConfig:   this.buildTableConfig(sentRows,   { selectable: false, showFailReason: false, emptyText: 'Chưa có phòng nào gửi thành công.' }),
      mergedConfig: this.buildTableConfig(mergedRows, { selectable: false, showFailReason: false, emptyText: '' }),
    };
  }));

  ngOnInit(): void {
    this.cellTemplates = { invoiceStatus: this.statusTpl, totalAmount: this.amountTpl, dueDate: this.dueDateTpl };
  }

  private toPeriodLabel(period: string): string {
    const [year, month] = period.split('-');
    return `${month}/${year}`;
  }

  private buildTableConfig(
    rows: BatchRoomRow[],
    { selectable, showFailReason, emptyText }: { selectable: boolean; showFailReason: boolean; emptyText: string },
  ): TableConfig<BatchRoomRow> {
    return {
      rowKey:     'roomId',
      data:       rows,
      selectable,
      emptyText,
      columns: [
        { key: 'roomNumber',     label: 'Phòng' },
        { key: 'tenantName',     label: 'Người thuê', formatter: value => (value as string | null) ?? '—' },
        { key: 'invoiceStatus',  label: 'Trạng thái' },
        { key: 'totalAmount',    label: 'Tổng tiền', align: 'right' },
        { key: 'dueDate',        label: 'Hạn đóng' },
        { key: 'lastFailReason', label: 'Lý do chưa gửi', hide: !showFailReason, formatter: value => (value as string | null) ?? '' },
      ],
      actions: selectable ? [{
        label:    'Gửi thông báo',
        icon:     'mail',
        disabled: row => !row.invoiceId,
        action:   row => this.sendOne(row),
      }] : undefined,
    };
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  onFilterChange(value: FilterValue): void {
    this.filterPeriod.set((value['period'] as string) ?? null);
    this.visibleBatchCount.set(BATCHES_PER_PAGE);
    this.loadData();
  }

  loadMore(): void {
    this.visibleBatchCount.update(count => Math.min(count + BATCHES_PER_PAGE, MAX_BATCHES));
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.api.get<ApiResponse<{ items: ClosingBatch[]; total: number }>>('/closing-batches', {
      page:     1,
      pageSize: this.visibleBatchCount(),
      period:   this.filterPeriod(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.selectedByBatchId.set({});
        this.totalBatches.set(res.data.total);
        this.batches.set(res.data.items);
      });
  }

  // ── Selection & navigation ────────────────────────────────────────────────
  onSelectChange(batchId: string, rows: BatchRoomRow[]): void {
    this.selectedByBatchId.update(selected => ({ ...selected, [batchId]: rows }));
  }

  selectedCount(batchId: string): number {
    return this.selectedByBatchId()[batchId]?.length ?? 0;
  }

  onRowClick(row: BatchRoomRow): void {
    if (row.mergedInvoiceId) this.router.navigateByUrl(`/app/invoices/merged/${row.mergedInvoiceId}`);
    else if (row.invoiceId)  this.router.navigateByUrl(`/app/invoices/${row.invoiceId}`);
    else                     this.router.navigateByUrl(`/app/invoices/room/${row.roomId}`);
  }

  // ── Sending ───────────────────────────────────────────────────────────────
  sendOne(row: BatchRoomRow): void {
    if (!row.invoiceId) return;
    this.saving.set(true);
    this.api.post<ApiResponse<{ success: boolean; reason?: string; channel?: 'sms' | 'email' }>>('/notifications/send', { invoiceId: row.invoiceId })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (res.data?.success) {
          this.toast.success(`Phòng ${row.roomNumber}: Đã gửi qua ${this.channelLabel(res.data.channel ?? '')}.`);
        } else {
          this.toast.error(`Thất bại cả 2 kênh: ${res.data?.reason ?? 'Không gửi được thông báo.'}`);
        }
        this.loadData();
      });
  }

  channelLabel(channel: string): string {
    if (channel === 'email') return 'Email';
    if (channel === 'sms') return 'SMS';
    return channel;
  }

  sendSelected(view: BatchView): void {
    this.confirmAndBulkSend(this.selectedByBatchId()[view.id] ?? []);
  }

  sendAllUnsent(view: BatchView): void {
    this.confirmAndBulkSend(view.unsentRows);
  }

  private confirmAndBulkSend(rows: BatchRoomRow[]): void {
    const sendableRows = rows.filter(r => r.invoiceId);
    if (sendableRows.length === 0) {
      this.toast.error('Các phòng đã chọn chưa có hoá đơn.');
      return;
    }
    this.confirmDialog.confirm({
      title:   `Gửi thông báo cho ${sendableRows.length} phòng?`,
      content: 'Tin nhắn sẽ được gửi thật tới người thuê.',
      okText:  'Gửi',
    }).pipe(filter(confirmed => confirmed))
      .subscribe(() => this.bulkSend(sendableRows));
  }

  private bulkSend(rows: BatchRoomRow[]): void {
    const invoiceIds = rows.map(r => r.invoiceId as string);
    this.saving.set(true);
    this.api.post<ApiResponse<BulkSendResult>>('/notifications/send-bulk', { invoiceIds })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success || !res.data) return;
          const { sent, failed } = res.data;
          if (failed.length === 0) {
            this.toast.success(`Đã gửi ${sent}/${invoiceIds.length} thông báo.`);
          } else {
            const roomNumberByInvoiceId = new Map(rows.map(r => [r.invoiceId, r.roomNumber]));
            const detail = failed.map(f => `P.${roomNumberByInvoiceId.get(f.invoiceId) ?? f.invoiceId}: ${f.reason}`).join('; ');
            this.toast.error(`Đã gửi ${sent}/${invoiceIds.length}. Lỗi: ${detail}`);
          }
          this.loadData();
        },
        error: err => {
          this.toast.error(err?.error?.message ?? 'Không gửi được thông báo hàng loạt.');
          this.loadData();
        },
      });
  }
}
