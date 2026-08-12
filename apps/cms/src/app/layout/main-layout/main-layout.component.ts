import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TopbarComponent } from '../../shared/components/layout/topbar/topbar.component';
import { FooterComponent } from '../../shared/components/layout/footer/footer.component';
import { BottomNavComponent } from '../../shared/components/layout/bottom-nav/bottom-nav.component';
import { OfflineBannerComponent } from '../../shared/components/layout/offline-banner/offline-banner.component';
import { StorageService } from '../../core/services/storage.service';
import { PermissionService } from '../../core/permission/services/permission.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserRole } from '../../core/auth/auth.types';
import { MenuItem, NAV_ITEMS, canShowNavItem } from '../../layout/sidebar/side-items';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector:        'app-main-layout',
  standalone:      true,
  templateUrl:     './main-layout.component.html',
  styleUrls:       ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NzLayoutModule,
    NzIconModule,
    TopbarComponent,
    FooterComponent,
    BottomNavComponent,
    OfflineBannerComponent,
  ],
})
export class MainLayoutComponent {
  private storage     = inject(StorageService);
  private router      = inject(Router);
  private permissions = inject(PermissionService);
  private auth        = inject(AuthService);
  layout              = inject(LayoutService);

  collapsed = signal<boolean>(this.storage.get<boolean>('sidebar_collapsed') ?? false);

  get menuItems(): MenuItem[] {
    const roomId = this.auth.currentUser()?.roomId;
    return NAV_ITEMS.map(item =>
      item.route?.includes(':roomId') && roomId
        ? { ...item, route: item.route.replace(':roomId', roomId) }
        : item,
    );
  }

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  toggleSidebar(): void {
    this.collapsed.update(v => !v);
    this.storage.set('sidebar_collapsed', this.collapsed());
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.currentUrl().startsWith(route);
  }

  isSubmenuOpen(item: MenuItem): boolean {
    return (item.children ?? []).some(c => this.isActive(c.route));
  }

  navigate(route?: string): void {
    if (!route) return;
    this.router.navigateByUrl(route);
  }

  canShow(item: MenuItem): boolean {
    return canShowNavItem(item, this.menuItems, {
      hasPermission: p => this.permissions.hasPermission(p),
      isAdmin:       this.auth.hasRole(UserRole.ADMIN),
      isTenant:      this.auth.hasRole(UserRole.TENANT),
    });
  }
}
