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
        <div class="auth-card">
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
