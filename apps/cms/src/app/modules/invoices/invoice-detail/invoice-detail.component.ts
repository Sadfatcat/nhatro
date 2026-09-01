import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { finalize } from 'rxjs';
import { Invoice } from '@nhatro/shared-types';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

@Component({
  selector:        'app-invoice-detail',
  standalone:      true,
  templateUrl:     './invoice-detail.component.html',
  styleUrls:       ['./invoice-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, FormsModule,
    NzButtonModule, NzIconModule, NzSpinModule, NzModalModule, NzInputNumberModule, NzDatePickerModule,
    MoneyDisplayComponent, StatusBadgeComponent, PermissionDirective,
  ],
})
export class InvoiceDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private api    = inject(ApiService);
  private toast  = inject(ToastService);

  invoice = signal<Invoice | null>(null);
  loading = signal(true);
  saving  = signal(false);
  showDeleteModal = signal(false);

  editing   = signal(false);
  editForm  = signal<{ rentAmount: number; electricityAmount: number; waterAmount: number; garbageFee: number; otherFees: number; deduction: number; dueDate: Date }>({
    rentAmount: 0, electricityAmount: 0, waterAmount: 0, garbageFee: 0, otherFees: 0, deduction: 0, dueDate: new Date(),
  });

  /** Tổng chênh lệch totalAmount cộng dồn từ toàn bộ lần sửa thủ công (to - from của các field tiền). */
  totalEditDelta = computed<number>(() => {
    const inv = this.invoice();
    if (!inv) return 0;
    const moneyFields = ['rentAmount', 'electricityAmount', 'waterAmount', 'garbageFee', 'otherFees'];
    let delta = 0;
    for (const log of inv.editLogs ?? []) {
      for (const field of moneyFields) {
        const change = log.changes[field];
        if (change) delta += Number(change.to) - Number(change.from);
      }
      const deductionChange = log.changes['deduction'];
      if (deductionChange) delta -= Number(deductionChange.to) - Number(deductionChange.from);
    }
    return delta;
  });

  activityLog = computed<{ id: string; at: string; color: 'white' | 'red' | 'green' | 'orange'; text: string }[]>(() => {
    const inv = this.invoice();
    if (!inv) return [];
    const events: { id: string; at: string; color: 'white' | 'red' | 'green' | 'orange'; text: string }[] = [];

    for (const log of inv.notificationLogs ?? []) {
      events.push({
        id:    `notify-${log.id}`,
        at:    log.sentAt,
        color: 'white',
        text:  `Đã gửi thông báo "${this.templateLabel(log.templateKey)}" qua ${this.channelLabel(log.channel)}${log.success ? '' : ' — thất bại: ' + log.reason}`,
      });
    }
    for (const log of inv.editLogs ?? []) {
      events.push({
        id:    `edit-${log.id}`,
        at:    log.editedAt,
        color: 'orange',
        text:  `Sửa thủ công${log.editedBy ? ' bởi ' + log.editedBy : ''}: ${this.describeChanges(log.changes)}`,
      });
    }
    if (inv.status === 'PAID' && inv.paidAt) {
      events.push({ id: 'paid', at: inv.paidAt, color: 'green', text: `Đã thanh toán${inv.markedBy ? ' — xác nhận bởi ' + inv.markedBy : ''}` });
    }
    if (inv.status === 'OVERDUE') {
      events.push({ id: 'overdue', at: inv.dueDate, color: 'red', text: 'Quá hạn thanh toán' });
    }

    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  });

  private describeChanges(changes: Record<string, { from: unknown; to: unknown }>): string {
    const labels: Record<string, string> = {
      rentAmount:        'Tiền phòng',
      electricityAmount: 'Tiền điện',
      waterAmount:       'Tiền nước',
      garbageFee:        'Phí rác',
      otherFees:         'Phí khác',
      deduction:         'Khấu trừ',
      dueDate:           'Hạn đóng',
    };
    return Object.entries(changes)
      .map(([key, { from, to }]) => `${labels[key] ?? key}: ${from} → ${to}`)
      .join(', ');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadData(id);
  }

  loadData(id: string): void {
    this.loading.set(true);
    this.api.get<ApiResponse<Invoice>>(`/invoices/${id}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => { if (res.success) this.invoice.set(res.data); });
  }

  goBack(): void { this.router.navigate(['/app/invoices']); }

  markPaid(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>(`/invoices/${inv.id}/mark-paid`, {})
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Đã đánh dấu thanh toán.');
        this.loadData(inv.id);
      });
  }

  sendNotification(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.saving.set(true);
    this.api.post<ApiResponse<{ success: boolean; reason?: string; channel?: 'sms' | 'email' }>>('/notifications/send', { invoiceId: inv.id })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (res.data?.success) {
          this.toast.success(`Đã gửi qua ${this.channelLabel(res.data.channel ?? '')}.`);
        } else {
          this.toast.error(`Thất bại cả 2 kênh: ${res.data?.reason ?? 'Không gửi được thông báo.'}`);
        }
        this.loadData(inv.id);
      });
  }

  channelLabel(channel: string): string {
    if (channel === 'email') return 'Email';
    if (channel === 'sms') return 'SMS';
    return channel;
  }

  templateLabel(key: string): string {
    const labels: Record<string, string> = {
      'invoice-created':  'Hoá đơn mới',
      'invoice-due-soon': 'Nhắc sắp đến hạn',
      'invoice-overdue':  'Quá hạn',
      'invoice-paid':     'Đã thanh toán',
    };
    return labels[key] ?? key;
  }

  confirmDelete(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.saving.set(true);
    this.api.delete<ApiResponse<null>>(`/invoices/${inv.id}`)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) return;
          this.toast.success('Đã xoá hoá đơn.');
          this.showDeleteModal.set(false);
          this.router.navigate(['/app/invoices']);
        },
        error: err => {
          this.toast.error(err?.error?.message ?? 'Không xoá được hoá đơn.');
        },
      });
  }

  copyAccountNumber(): void {
    const num = this.invoice()?.bankInfo?.bankAccountNumber;
    if (!num) return;
    navigator.clipboard.writeText(num).then(() => this.toast.success('Đã sao chép số tài khoản.'));
  }

  startEdit(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.editForm.set({
      rentAmount:        inv.rentAmount,
      electricityAmount: inv.electricityAmount,
      waterAmount:       inv.waterAmount,
      garbageFee:        inv.garbageFee,
      otherFees:         inv.otherFees,
      deduction:         inv.deduction,
      dueDate:           new Date(inv.dueDate),
    });
    this.editing.set(true);
  }

  cancelEdit(): void { this.editing.set(false); }

  patchEditForm(patch: Partial<{ rentAmount: number; electricityAmount: number; waterAmount: number; garbageFee: number; otherFees: number; deduction: number; dueDate: Date }>): void {
    this.editForm.update(f => ({ ...f, ...patch }));
  }

  submitEdit(): void {
    const inv = this.invoice();
    if (!inv) return;
    const form = this.editForm();
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>(`/invoices/${inv.id}`, {
      rentAmount:        form.rentAmount,
      electricityAmount: form.electricityAmount,
      waterAmount:       form.waterAmount,
      garbageFee:        form.garbageFee,
      otherFees:         form.otherFees,
      deduction:         form.deduction,
      dueDate:           form.dueDate.toISOString(),
    }).pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) return;
          this.toast.success('Đã cập nhật hoá đơn.');
          this.editing.set(false);
          this.loadData(inv.id);
        },
        error: err => this.toast.error(err?.error?.message ?? 'Không cập nhật được hoá đơn.'),
      });
  }
}
