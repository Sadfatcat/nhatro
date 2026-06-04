import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PermissionService } from '../../core/auth/permission/services/permission.service';
import { MenuItem, NAV_ITEMS } from '../../core/layout/navigation/side-items';

export type { MenuItem };

@Component({
  selector:        'app-sidebar',
  standalone:      true,
  templateUrl:     './sidebar.component.html',
  styleUrls:       ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NzIconModule,
  ],
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Input() menuItems: MenuItem[] = NAV_ITEMS;

  private router      = inject(Router);
  private permissions = inject(PermissionService);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

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
    if (!item.permission) return true;
    const perms = Array.isArray(item.permission) ? item.permission : [item.permission];
    return perms.every(p => this.permissions.hasPermission(p));
  }
}
