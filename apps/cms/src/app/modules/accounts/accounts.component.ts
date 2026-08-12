import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../shared/components/feedback/toast/toast.service';
import { LayoutService } from '../../core/services/layout.service';

interface LandlordRow {
  userId:     string;
  landlordId: string | null;
  username:   string;
  fullName:   string;
  phone:      string | null;
  isActive:   boolean;
  createdAt:  string;
  roomCount:  number;
  role:       'LANDLORD' | 'ADMIN';
}

interface AccountsResponse { landlords: LandlordRow[]; }

@Component({
  selector:        'app-accounts',
  standalone:      true,
  templateUrl:     './accounts.component.html',
  styleUrls:       ['./accounts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule, NzModalModule, NzSelectModule, NzTableModule, NzTooltipModule,
  ],
})
export class AccountsComponent implements OnInit {
  private api   = inject(ApiService);
  private toast = inject(ToastService);
  layout = inject(LayoutService);

  loading   = signal(false);
  saving    = signal(false);
  landlords = signal<LandlordRow[]>([]);

  // ── Modals ─────────────────────────────────────────────────────────────────
  landlordModal        = signal(false);
  changeRoleModal       = signal(false);
  selectedLandlord      = signal<LandlordRow | null>(null);
  newRole: 'LANDLORD' | 'ADMIN' = 'LANDLORD';
  changePasswordModal   = signal(false);

  // ── Forms ──────────────────────────────────────────────────────────────────
  landlordForm        = { username: '', password: '', fullName: '', phone: '' };
  changePasswordForm  = { userId: '', newPassword: '' };

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.get<AccountsResponse>('/accounts')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  data => this.landlords.set(data.landlords),
        error: ()   => this.toast.error('Không tải được danh sách tài khoản.'),
      });
  }

  // ── Chủ nhà ───────────────────────────────────────────────────────────────
  openLandlordModal(): void { this.landlordForm = { username: '', password: '', fullName: '', phone: '' }; this.landlordModal.set(true); }
  closeLandlordModal(): void { this.landlordModal.set(false); }

  createLandlordAccount(): void {
    this.saving.set(true);
    this.api.post('/accounts/landlords', this.landlordForm)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã tạo tài khoản chủ nhà.'); this.closeLandlordModal(); this.load(); },
        error: () => this.toast.error('Không tạo được tài khoản chủ nhà.'),
      });
  }

  // ── Đổi vai trò ──────────────────────────────────────────────────────────
  openChangeRoleModal(row: LandlordRow): void {
    this.selectedLandlord.set(row);
    this.newRole = row.role === 'ADMIN' ? 'LANDLORD' : 'ADMIN';
    this.changeRoleModal.set(true);
  }
  closeChangeRoleModal(): void { this.changeRoleModal.set(false); this.selectedLandlord.set(null); }

  submitChangeRole(): void {
    const user = this.selectedLandlord();
    if (!user) return;
    this.saving.set(true);
    this.api.patch(`/accounts/users/${user.userId}/role`, { role: this.newRole })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã cập nhật vai trò.'); this.closeChangeRoleModal(); this.load(); },
        error: () => this.toast.error('Không đổi được vai trò.'),
      });
  }

  // ── Đổi mật khẩu ─────────────────────────────────────────────────────────
  openChangePasswordForUser(userId: string): void {
    this.changePasswordForm = { userId, newPassword: '' };
    this.changePasswordModal.set(true);
  }
  closeChangePasswordModal(): void { this.changePasswordModal.set(false); }

  submitChangePassword(): void {
    const { userId, newPassword } = this.changePasswordForm;
    if (!userId || !newPassword) { this.toast.error('Vui lòng nhập mật khẩu mới.'); return; }
    this.saving.set(true);
    this.api.patch(`/accounts/users/${userId}/password`, { password: newPassword })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next:  () => { this.toast.success('Đã đổi mật khẩu thành công.'); this.closeChangePasswordModal(); },
        error: () => this.toast.error('Không đổi được mật khẩu.'),
      });
  }
}
