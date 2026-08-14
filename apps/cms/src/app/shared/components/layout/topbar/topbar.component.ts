import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputModule } from 'ng-zorro-antd/input';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { LayoutService } from '../../../../core/services/layout.service';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../feedback/toast/toast.service';
import { Router } from '@angular/router';

interface ApiResponse<T> { success: boolean; data: T | null; message: string; }

@Component({
  selector:        'app-topbar',
  standalone:      true,
  templateUrl:     './topbar.component.html',
  styleUrls:       ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
    NzBadgeModule,
    NzTooltipModule,
    NzMenuModule,
    NzModalModule,
    NzInputModule,
  ],
})
export class TopbarComponent {
  @Input() showSearch = false;
  @Input() showUtilityActions = true;
  @Input() showUserMenu = true;
  @Input() contactHref = '/contact';
  @Output() toggleSidebar = new EventEmitter<void>();

  auth    = inject(AuthService);
  loading = inject(LoadingService);
  theme   = inject(ThemeService);
  layout  = inject(LayoutService);
  router  = inject(Router);
  private api   = inject(ApiService);
  private toast = inject(ToastService);

  get userInitial(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.charAt(0).toUpperCase() || 'K';
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  // ── Đổi mật khẩu ─────────────────────────────────────────────────────────
  showChangePasswordModal = signal(false);
  saving = signal(false);
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';

  get isAdmin(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  openChangePassword(): void {
    this.oldPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showChangePasswordModal.set(true);
  }

  closeChangePassword(): void {
    this.showChangePasswordModal.set(false);
  }

  confirmChangePassword(): void {
    if (!this.isAdmin && !this.oldPassword) {
      this.toast.error('Vui lòng nhập mật khẩu cũ.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    this.saving.set(true);
    this.api.patch<ApiResponse<null>>('/auth/change-password', {
      oldPassword: this.isAdmin ? undefined : this.oldPassword,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword,
    }).pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: res => {
          if (!res.success) return;
          this.toast.success('Đã đổi mật khẩu.');
          this.closeChangePassword();
        },
        error: err => this.toast.error(err?.error?.message ?? 'Không đổi được mật khẩu.'),
      });
  }
}
