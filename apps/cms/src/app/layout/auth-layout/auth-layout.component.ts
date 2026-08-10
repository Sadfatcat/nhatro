import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { TopbarComponent } from '../../shared/components/layout/topbar/topbar.component';

@Component({
  selector:        'app-auth-layout',
  standalone:      true,
  template: `
    <div class="auth-page">
      <app-topbar [showUtilityActions]="false" [showUserMenu]="false" />
      <div class="auth-layout">
        <div class="auth-glow"></div>
        <div class="auth-card">
          <div class="auth-brand">
            <img class="auth-brand-mark" src="/brand-mark.svg" alt="" />
            <div>
              <div class="auth-brand-name">NhaTro</div>
              <div class="auth-brand-tagline">Rental management</div>
            </div>
          </div>
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styleUrls:       ['./auth-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, NzLayoutModule, TopbarComponent],
})
export class AuthLayoutComponent {}
