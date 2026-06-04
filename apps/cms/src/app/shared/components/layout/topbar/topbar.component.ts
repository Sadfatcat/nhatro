import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { Router } from '@angular/router';

@Component({
  selector:        'app-topbar',
  standalone:      true,
  templateUrl:     './topbar.component.html',
  styleUrls:       ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
    NzBadgeModule,
    NzTooltipModule,
    NzMenuModule,
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
  router  = inject(Router);

  get userInitial(): string {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name.charAt(0).toUpperCase() || 'K';
  }

  onLogout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
