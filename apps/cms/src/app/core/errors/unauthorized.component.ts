import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { TopbarComponent } from '../../shared/components/layout/topbar/topbar.component';

@Component({
  selector:   'app-unauthorized',
  standalone: true,
  template: `
    <app-topbar [showUtilityActions]="false" [showUserMenu]="false" />
    <div class="unauthorized-page">
      <div class="lock-icon">!</div>
      <h1>Không có quyền truy cập</h1>
      <p>
        Tài khoản <strong>{{ auth.roleLabel() }}</strong> không có quyền xem trang này.
      </p>
      <div class="actions">
        <button class="primary" (click)="goHome()">Về trang chủ</button>
        <button class="secondary" (click)="goBack()">Quay lại</button>
      </div>
    </div>
  `,
  styles: [`
    .unauthorized-page {
      display: flex;
      min-height: calc(100vh - 64px);
      margin-top: 64px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      text-align: center;
      background: var(--color-bg-subtle);
      color: var(--color-text-primary);
    }

    .lock-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--color-error-bg);
      color: var(--color-error);
      font-size: 40px;
      font-weight: 800;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
    }

    p {
      max-width: 460px;
      margin: 0;
      color: var(--color-text-secondary);
    }

    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: center;
    }

    button {
      min-height: 40px;
      border-radius: 8px;
      padding: 0 16px;
      font-weight: 700;
      cursor: pointer;
    }

    .primary {
      border: 0;
      background: var(--color-primary);
      color: #fff;
    }

    .secondary {
      border: 1px solid var(--color-border);
      background: var(--color-bg-card);
      color: var(--color-text-primary);
    }
  `],
  imports: [TopbarComponent],
})
export class UnauthorizedComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  goHome(): void { this.router.navigate(['/app/home']); }
  goBack(): void  { history.back(); }
}
