import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { finalize } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';
import { PermissionService } from '../../../core/permission/services/permission.service';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig } from '../../../shared/components/display/data-table/data-table.model';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { Invoice } from '@nhatro/shared-types';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

interface GenerateResult {
  created: unknown[];
  skipped: { roomId: string; roomNumber: string; reason: string }[];
}

type InvoiceRow = {
  id:            string;
  period:        string;
  totalAmount:   number;
  status:        Invoice['status'];
  dueDate:       string;
} & Record<string, unknown>;

function currentPeriod(): string {
  const d = new Date();
  const dt = new Date(d.getFullYear(), d.getDate() <= 10 ? d.getMonth() - 1 : d.getMonth(), 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector:        'app-invoice-room-history',
  standalone:      true,
  templateUrl:     './invoice-room-history.component.html',
  styleUrls:       ['./invoice-room-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzButtonModule, NzIconModule,
    DataTableComponent, StatusBadgeComponent, MoneyDisplayComponent, PermissionDirective,
  ],
})
export class InvoiceRoomHistoryComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<unknown>;
  @ViewChild('amountTpl', { static: true }) amountTpl!: TemplateRef<unknown>;
  @ViewChild('dueDateTpl', { static: true }) dueDateTpl!: TemplateRef<unknown>;

  private route       = inject(ActivatedRoute);
  private router      = inject(Router);
  private api         = inject(ApiService);
  private toast       = inject(ToastService);
  private permissions = inject(PermissionService);

  private roomId = '';
  canManage = this.permissions.hasPermission('invoices:manage');

  loading = signal(false);
  saving  = signal(false);
  roomNumber = signal<string>('');
  items = signal<InvoiceRow[]>([]);

  get cellTemplates(): Record<string, TemplateRef<unknown>> {
    return { status: this.statusTpl, totalAmount: this.amountTpl, dueDate: this.dueDateTpl };
  }

  get tableConfig(): TableConfig<InvoiceRow> {
    return {
      rowKey:    'id',
      data:      this.items(),
      loading:   this.loading(),
      emptyText: 'Phòng này chưa có hoá đơn nào.',
      columns: [
        { key: 'period',      label: 'Kỳ' },
        { key: 'totalAmount', label: 'Tổng tiền', align: 'right' },
        { key: 'status',      label: 'Trạng thái' },
        { key: 'dueDate',     label: 'Hạn đóng' },
      ],
    };
  }

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (!roomId) return;
    this.roomId = roomId;
    this.loadData(roomId);
  }

  loadData(roomId: string): void {
    this.loading.set(true);
    this.api.get<ApiResponse<(Invoice & { room: { roomNumber: string } })[]>>('/invoices', { roomId })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(invoices => {
        this.roomNumber.set(invoices.data?.[0]?.room.roomNumber ?? '');

        this.items.set((invoices.data ?? [])
          .map(inv => ({
            id:          inv.id,
            period:      inv.period,
            totalAmount: inv.totalAmount,
            status:      inv.status,
            dueDate:     inv.dueDate,
          }))
          .sort((a, b) => b.period.localeCompare(a.period)));
      });
  }

  onRowClick(row: InvoiceRow): void {
    this.router.navigateByUrl(`/app/invoices/${row.id}`);
  }

  goBack(): void { this.router.navigateByUrl('/app/invoices'); }

  createInvoice(): void {
    if (!this.roomId) return;
    this.saving.set(true);
    this.api.post<ApiResponse<GenerateResult>>('/invoices/generate', {
      period: currentPeriod(),
      roomIds: [this.roomId],
    }).pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success || !res.data) return;
        if (res.data.created.length > 0) {
          this.toast.success('Đã tạo hoá đơn.');
          this.loadData(this.roomId);
        } else {
          this.toast.error(res.data.skipped[0]?.reason ?? 'Không tạo được hoá đơn.');
        }
      });
  }
}
