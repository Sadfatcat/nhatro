import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TopbarComponent } from '../../shared/components/layout/topbar/topbar.component';
import { FooterComponent } from '../../shared/components/layout/footer/footer.component';
import { StorageService } from '../../core/services/storage.service';
import { PermissionService } from '../../core/permission/services/permission.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { UserRole } from '../../core/auth/auth.types';
import { MenuItem, NAV_ITEMS } from '../../layout/sidebar/side-items';

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
  ],
})
export class MainLayoutComponent {
  private storage     = inject(StorageService);
  private router      = inject(Router);
  private permissions = inject(PermissionService);
  private auth        = inject(AuthService);

  collapsed = signal<boolean>(this.storage.get<boolean>('sidebar_collapsed') ?? false);
  menuItems: MenuItem[] = NAV_ITEMS;

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
    if (item.divider) {
      const idx = this.menuItems.indexOf(item);
      return this.menuItems.slice(idx + 1).some(next => !next.divider && this.canShow(next));
    }
    // Admin holds both home:view and management-home:view via ALL_PERMISSIONS.
    // The tenant-home entry point for Admin is the in-page toggle on
    // ManagementHomeComponent, not a second sidebar item.
    if (item.key === 'home' && this.auth.hasRole(UserRole.ADMIN)) return false;
    if (!item.permission) return true;
    const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
    return perms.every(p => this.permissions.hasPermission(p));
  }
}
