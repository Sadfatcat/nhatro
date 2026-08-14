import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { finalize } from 'rxjs';
import { Invoice } from '@nhatro/shared-types';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';
import { AuthService } from '../../../core/auth/services/auth.service';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

@Component({
  selector:        'app-invoice-detail',
  standalone:      true,
  templateUrl:     './invoice-detail.component.html',
  styleUrls:       ['./invoice-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule,
    NzButtonModule, NzIconModule, NzSpinModule, NzModalModule,
    MoneyDisplayComponent, StatusBadgeComponent, PermissionDirective,
  ],
})
export class InvoiceDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private api    = inject(ApiService);
  private toast  = inject(ToastService);
  readonly auth  = inject(AuthService);

  invoice = signal<Invoice | null>(null);
  loading = signal(true);
  saving  = signal(false);
  showDeleteModal = signal(false);

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
    this.api.patch<ApiResponse<unknown>>(`/invoices/${inv.id}/mark-paid`, {
      markedBy: this.auth.currentUser()?.fullName,
    }).pipe(finalize(() => this.saving.set(false)))
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
    this.api.post<ApiResponse<{ success: boolean; reason?: string }>>('/notifications/send', { invoiceId: inv.id })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (res.data?.success) {
          this.toast.success('Đã gửi thông báo.');
        } else {
          this.toast.error(res.data?.reason ?? 'Không gửi được thông báo.');
        }
        this.loadData(inv.id);
      });
  }

  sendSms(): void {
    const inv = this.invoice();
    if (!inv) return;
    this.saving.set(true);
    this.api.post<ApiResponse<{ success: boolean; reason?: string }>>('/notifications/send', { invoiceId: inv.id, channel: 'sms' })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (res.data?.success) {
          this.toast.success('Đã gửi SMS.');
        } else {
          this.toast.error(res.data?.reason ?? 'Không gửi được SMS.');
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
}
