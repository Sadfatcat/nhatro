import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TopbarComponent } from '../../shared/components/layout/topbar/topbar.component';

@Component({
  selector:        'app-page403',
  standalone:      true,
  template: `
    <div class="error-shell">
      <app-topbar [showUtilityActions]="false" [showUserMenu]="false" />
      <div class="error-page">
        <nz-result
          nzStatus="403"
          nzTitle="403"
          nzSubTitle="Bạn không có quyền truy cập trang này.">
          <div nz-result-extra>
            <button nz-button nzType="primary" routerLink="/app/home">Về trang chủ</button>
          </div>
        </nz-result>
      </div>
    </div>
  `,
  styles: [`
    .error-shell { padding-top: 64px; }
    .error-page { display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 64px); }
    :host ::ng-deep .ant-result-title { color: var(--color-text-primary); }
    :host ::ng-deep .ant-result-subtitle { color: var(--color-text-muted); }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, NzResultModule, NzButtonModule, TopbarComponent],
})
export class Page403Component {}
