import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig } from '../../../shared/components/display/data-table/data-table.model';
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
} & Record<string, unknown>;

@Component({
  selector:        'app-invoice-creation-log',
  standalone:      true,
  templateUrl:     './invoice-creation-log.component.html',
  styleUrls:       ['./invoice-creation-log.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataTableComponent, StatusBadgeComponent, MoneyDisplayComponent, FilterPanelComponent,
  ],
})
export class InvoiceCreationLogComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<unknown>;
  @ViewChild('amountTpl', { static: true }) amountTpl!: TemplateRef<unknown>;
  @ViewChild('dateTpl', { static: true }) dateTpl!: TemplateRef<unknown>;

  private api    = inject(ApiService);
  private router = inject(Router);

  loading = signal(false);
  items   = signal<InvoiceLogRow[]>([]);

  filterPeriod  = signal<string | null>(null);
  filterRooms   = signal<string[] | null>(null);

  periodOptions = computed(() => {
    const periods = [...new Set(this.items().map(r => r.period))].sort((a, b) => b.localeCompare(a));
    return periods.map(p => ({ label: `Kỳ ${p}`, value: p }));
  });

  roomOptions = computed(() => {
    const rooms = [...new Set(this.items().map(r => r.roomNumber))]
      .sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    return rooms.map(r => ({ label: r, value: r }));
  });

  filterNotified = signal<string | null>(null);

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

  filteredItems = computed(() => {
    const period   = this.filterPeriod();
    const rooms    = this.filterRooms();
    const notified = this.filterNotified();
    let rows = this.items();
    if (period) rows = rows.filter(r => r.period === period);
    if (rooms && rooms.length) rows = rows.filter(r => rooms.includes(r.roomNumber));
    if (notified === 'yes') rows = rows.filter(r => r.notified);
    if (notified === 'no')  rows = rows.filter(r => !r.notified);
    return [...rows].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true }));
  });

  onFilterChange(value: FilterValue): void {
    this.filterPeriod.set((value['period'] as string) ?? null);
    this.filterRooms.set((value['roomIds'] as string[]) ?? null);
    this.filterNotified.set((value['notified'] as string) ?? null);
  }

  get cellTemplates(): Record<string, TemplateRef<unknown>> {
    return { status: this.statusTpl, totalAmount: this.amountTpl, createdAt: this.dateTpl, dueDate: this.dateTpl };
  }

  get tableConfig(): TableConfig<InvoiceLogRow> {
    return {
      rowKey:    'id',
      data:      this.filteredItems(),
      loading:   this.loading(),
      emptyText: 'Chưa có hoá đơn nào được tạo.',
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

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.api.get<ApiResponse<(Invoice & {
      room: { roomNumber: string };
      contract: { tenant: { fullName: string } };
      _count: { notificationLogs: number };
    })[]>>('/invoices')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.items.set(res.data
          .map(inv => ({
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
}
