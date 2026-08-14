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
  period:        string;
  totalAmount:   number;
  status:        Invoice['status'];
  createdAt:     string;
  dueDate:       string;
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

  filterConfig = computed<FilterConfig>(() => ({
    fields: [
      { key: 'period',  label: 'Kỳ',   type: 'select',      options: this.periodOptions(), span: 8 },
      { key: 'roomIds', label: 'Phòng', type: 'multiselect', options: this.roomOptions(),    span: 12 },
    ],
    autoSearch: true,
    debounceMs: 0,
  }));

  filteredItems = computed(() => {
    const period = this.filterPeriod();
    const rooms  = this.filterRooms();
    let rows = this.items();
    if (period) rows = rows.filter(r => r.period === period);
    if (rooms && rooms.length) rows = rows.filter(r => rooms.includes(r.roomNumber));
    return [...rows].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, 'vi', { numeric: true }));
  });

  onFilterChange(value: FilterValue): void {
    this.filterPeriod.set((value['period'] as string) ?? null);
    this.filterRooms.set((value['roomIds'] as string[]) ?? null);
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
        { key: 'roomNumber',  label: 'Phòng' },
        { key: 'period',      label: 'Kỳ' },
        { key: 'totalAmount', label: 'Tổng tiền', align: 'right' },
        { key: 'status',      label: 'Trạng thái' },
        { key: 'createdAt',   label: 'Ngày tạo' },
        { key: 'dueDate',     label: 'Hạn đóng' },
      ],
    };
  }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.api.get<ApiResponse<(Invoice & { room: { roomNumber: string } })[]>>('/invoices')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.items.set(res.data
          .map(inv => ({
            id:          inv.id,
            roomNumber:  inv.room.roomNumber,
            period:      inv.period,
            totalAmount: inv.totalAmount,
            status:      inv.status,
            createdAt:   inv.createdAt,
            dueDate:     inv.dueDate,
          })));
      });
  }

  onRowClick(row: InvoiceLogRow): void {
    this.router.navigateByUrl(`/app/invoices/${row.id}`);
  }
}
