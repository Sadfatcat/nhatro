import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { finalize, forkJoin } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig, TableAction } from '../../../shared/components/display/data-table/data-table.model';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { RoomWithUtility, Invoice, InvoiceStatus } from '@nhatro/shared-types';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

type BillingDay = 15 | 30;

type RoomInvoiceRow = {
  roomId:        string;
  roomNumber:    string;
  tenantName:    string;
  invoiceId:     string | null;
  invoiceStatus: InvoiceStatus | null;
  totalAmount:   number | null;
  dueDate:       string | null;
} & Record<string, unknown>;

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector:        'app-invoices-by-billing-day',
  standalone:      true,
  templateUrl:     './invoices-by-billing-day.component.html',
  styleUrls:       ['./invoices-by-billing-day.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzCheckboxModule,
    DataTableComponent, StatusBadgeComponent, MoneyDisplayComponent, PermissionDirective,
  ],
})
export class InvoicesByBillingDayComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<unknown>;
  @ViewChild('amountTpl', { static: true }) amountTpl!: TemplateRef<unknown>;
  @ViewChild('dueDateTpl', { static: true }) dueDateTpl!: TemplateRef<unknown>;

  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  private router = inject(Router);

  readonly period = currentPeriod();

  loading = signal(false);
  saving  = signal(false);

  rows15    = signal<RoomInvoiceRow[]>([]);
  rows30    = signal<RoomInvoiceRow[]>([]);
  selected15 = signal<RoomInvoiceRow[]>([]);
  selected30 = signal<RoomInvoiceRow[]>([]);

  get cellTemplates(): Record<string, TemplateRef<unknown>> {
    return { invoiceStatus: this.statusTpl, totalAmount: this.amountTpl, dueDate: this.dueDateTpl };
  }

  tableConfig(rows: RoomInvoiceRow[]): TableConfig<RoomInvoiceRow> {
    return {
      rowKey:     'roomId',
      data:       rows,
      loading:    this.loading(),
      selectable: true,
      emptyText:  'Chưa có phòng nào ở ngày chốt này.',
      columns: [
        { key: 'roomNumber',    label: 'Phòng' },
        { key: 'tenantName',    label: 'Người thuê' },
        { key: 'invoiceStatus', label: 'Trạng thái' },
        { key: 'totalAmount',   label: 'Tổng tiền', align: 'right' },
        { key: 'dueDate',       label: 'Hạn đóng' },
      ],
      actions: [
        {
          label:    'Gửi thông báo',
          icon:     'mail',
          disabled: row => !row.invoiceId,
          action:   row => this.sendOne(row),
        },
      ],
    };
  }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    forkJoin({
      utilities: this.api.get<ApiResponse<RoomWithUtility[]>>('/utilities'),
      invoices:  this.api.get<ApiResponse<(Invoice & { room: { roomNumber: string } })[]>>('/invoices', { period: this.period }),
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ utilities, invoices }) => {
        if (!utilities.success || !utilities.data) return;
        const invoiceByRoomId = new Map((invoices.data ?? []).map(inv => [inv.roomId, inv]));

        const toNum = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
        const toRow = (r: RoomWithUtility): RoomInvoiceRow => {
          const inv = invoiceByRoomId.get(r.roomId);
          return {
            roomId:        r.roomId,
            roomNumber:    r.roomNumber,
            tenantName:    r.tenant?.fullName ?? '—',
            invoiceId:     inv?.id ?? null,
            invoiceStatus: inv?.status ?? null,
            totalAmount:   inv?.totalAmount ?? null,
            dueDate:       inv?.dueDate ?? null,
          };
        };

        const sort = (a: RoomInvoiceRow, b: RoomInvoiceRow) => toNum(a.roomNumber) - toNum(b.roomNumber);

        this.rows15.set(utilities.data.filter(r => r.billingDay === 15 && r.status === 'OCCUPIED').map(toRow).sort(sort));
        this.rows30.set(utilities.data.filter(r => r.billingDay === 30 && r.status === 'OCCUPIED').map(toRow).sort(sort));
      });
  }

  onSelectChange15(rows: RoomInvoiceRow[]): void { this.selected15.set(rows); }
  onSelectChange30(rows: RoomInvoiceRow[]): void { this.selected30.set(rows); }

  onRowClick(row: RoomInvoiceRow): void {
    this.router.navigateByUrl(`/app/invoices/room/${row.roomId}`);
  }

  sendOne(row: RoomInvoiceRow): void {
    if (!row.invoiceId) return;
    this.saving.set(true);
    this.api.post<ApiResponse<{ success: boolean; reason?: string }>>('/notifications/send', { invoiceId: row.invoiceId })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (res.data?.success) {
          this.toast.success(`Đã gửi thông báo cho phòng ${row.roomNumber}.`);
        } else {
          this.toast.error(res.data?.reason ?? 'Không gửi được thông báo.');
        }
      });
  }

  bulkSend(day: BillingDay): void {
    const selected = day === 15 ? this.selected15() : this.selected30();
    const invoiceIds = selected.map(r => r.invoiceId).filter((id): id is string => !!id);
    if (invoiceIds.length === 0) {
      this.toast.error('Các phòng đã chọn chưa có hoá đơn kỳ này.');
      return;
    }
    this.saving.set(true);
    this.api.post<ApiResponse<{ sent: number; failed: { invoiceId: string; reason: string }[] }>>('/notifications/send-bulk', { invoiceIds })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        this.toast.success(`Đã gửi ${res.data.sent}/${invoiceIds.length} thông báo.`);
        if (day === 15) this.selected15.set([]); else this.selected30.set([]);
      });
  }
}
