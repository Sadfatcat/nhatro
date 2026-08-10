import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { finalize, forkJoin } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { DataTableComponent } from '../../../shared/components/display/data-table/data-table.component';
import { TableConfig } from '../../../shared/components/display/data-table/data-table.model';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { Invoice } from '@nhatro/shared-types';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

type InvoiceRow = {
  id:            string;
  period:        string;
  totalAmount:   number;
  status:        Invoice['status'];
  dueDate:       string;
} & Record<string, unknown>;

@Component({
  selector:        'app-invoice-room-history',
  standalone:      true,
  templateUrl:     './invoice-room-history.component.html',
  styleUrls:       ['./invoice-room-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NzButtonModule, NzIconModule,
    DataTableComponent, StatusBadgeComponent, MoneyDisplayComponent,
  ],
})
export class InvoiceRoomHistoryComponent implements OnInit {
  @ViewChild('statusTpl', { static: true }) statusTpl!: TemplateRef<unknown>;
  @ViewChild('amountTpl', { static: true }) amountTpl!: TemplateRef<unknown>;
  @ViewChild('dueDateTpl', { static: true }) dueDateTpl!: TemplateRef<unknown>;

  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private api    = inject(ApiService);

  loading = signal(false);
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
    this.loadData(roomId);
  }

  loadData(roomId: string): void {
    this.loading.set(true);
    forkJoin({
      rooms:    this.api.get<ApiResponse<{ roomId: string; roomNumber: string }[]>>('/rooms'),
      invoices: this.api.get<ApiResponse<(Invoice & { room: { roomNumber: string } })[]>>('/invoices', { roomId }),
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe(({ rooms, invoices }) => {
        const room = rooms.data?.find(r => r.roomId === roomId);
        this.roomNumber.set(room?.roomNumber ?? invoices.data?.[0]?.room.roomNumber ?? '');

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

  goBack(): void { this.router.navigateByUrl('/app/invoices/by-billing-day'); }
}
