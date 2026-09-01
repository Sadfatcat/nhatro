import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { finalize } from 'rxjs';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormsModule } from '@angular/forms';
import { MergedInvoice } from '@nhatro/shared-types';

import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../shared/components/feedback/toast/toast.service';
import { MoneyDisplayComponent } from '../../../shared/components/display/money-display/money-display.component';
import { StatusBadgeComponent } from '../../../shared/components/display/status-badge/status-badge.component';
import { PermissionDirective } from '../../../core/permission/directives/permission.directive';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

@Component({
  selector:        'app-merged-invoice-detail',
  standalone:      true,
  templateUrl:     './merged-invoice-detail.component.html',
  styleUrls:       ['./merged-invoice-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, FormsModule,
    NzButtonModule, NzIconModule, NzSpinModule, NzInputNumberModule, NzDatePickerModule,
    MoneyDisplayComponent, StatusBadgeComponent, PermissionDirective,
  ],
})
export class MergedInvoiceDetailComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private api    = inject(ApiService);
  private toast  = inject(ToastService);

  merged  = signal<MergedInvoice | null>(null);
  loading = signal(true);
  saving  = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.loadData(id);
  }

  loadData(id: string): void {
    this.loading.set(true);
    this.api.get<ApiResponse<MergedInvoice>>(`/invoices/merged/${id}`)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe(res => { if (res.success) this.merged.set(res.data); });
  }

  goBack(): void { this.router.navigate(['/app/invoices']); }

  // ── Sửa chỉ số/phí từng phòng con ────────────────────────────────────────
  editingId = signal<string | null>(null);
  editForm  = signal<{ rentAmount: number; electricityAmount: number; waterAmount: number; garbageFee: number; otherFees: number; deduction: number; dueDate: Date }>({
    rentAmount: 0, electricityAmount: 0, waterAmount: 0, garbageFee: 0, otherFees: 0, deduction: 0, dueDate: new Date(),
  });

  startEdit(inv: { id: string; rentAmount: number; electricityAmount: number; waterAmount: number; garbageFee: number; otherFees: number; deduction: number; dueDate: string }): void {
    this.editForm.set({
      rentAmount:        inv.rentAmount,
      electricityAmount: inv.electricityAmount,
      waterAmount:       inv.waterAmount,
      garbageFee:        inv.garbageFee,
      otherFees:         inv.otherFees,
      deduction:         inv.deduction,
      dueDate:           new Date(inv.dueDate),
    });
    this.editingId.set(inv.id);
  }

  cancelEdit(): void { this.editingId.set(null); }

  patchEditForm(patch: Partial<{ rentAmount: number; electricityAmount: number; waterAmount: number; garbageFee: number; otherFees: number; deduction: number; dueDate: Date }>): void {
    this.editForm.update(f => ({ ...f, ...patch }));
  }

  submitEdit(): void {
    const invId = this.editingId();
    const merged = this.merged();
    if (!invId || !merged) return;
    const form = this.editForm();
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>(`/invoices/${invId}`, {
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
          this.toast.success('Đã cập nhật hoá đơn phòng.');
          this.editingId.set(null);
          this.loadData(merged.id);
        },
        error: err => this.toast.error(err?.error?.message ?? 'Không cập nhật được hoá đơn.'),
      });
  }

  sendNotification(): void {
    const merged = this.merged();
    if (!merged) return;
    this.saving.set(true);
    this.api.post<ApiResponse<{ success: boolean; reason?: string; channel?: 'sms' | 'email' }>>(`/invoices/merged/${merged.id}/notify`, {})
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (res.data?.success) {
          this.toast.success(`Đã gửi qua ${this.channelLabel(res.data.channel ?? '')}.`);
        } else {
          this.toast.error(`Thất bại cả 2 kênh: ${res.data?.reason ?? 'Không gửi được thông báo.'}`);
        }
      });
  }

  markPaid(): void {
    const merged = this.merged();
    if (!merged) return;
    this.saving.set(true);
    this.api.patch<ApiResponse<unknown>>(`/invoices/merged/${merged.id}/pay`, {})
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe(res => {
        if (!res.success) return;
        this.toast.success('Đã đánh dấu thanh toán hoá đơn gộp.');
        this.loadData(merged.id);
      });
  }

  channelLabel(channel: string): string {
    if (channel === 'email') return 'Email';
    if (channel === 'sms') return 'SMS';
    return channel;
  }

  copyAccountNumber(): void {
    const num = this.merged()?.bankInfo?.bankAccountNumber;
    if (!num) return;
    navigator.clipboard.writeText(num).then(() => this.toast.success('Đã sao chép số tài khoản.'));
  }
}
