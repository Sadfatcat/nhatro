import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PermissionService } from '../../../../core/permission/services/permission.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { UserRole } from '../../../../core/auth/auth.types';
import { MenuItem, NAV_ITEMS, canShowNavItem } from '../../../../layout/sidebar/side-items';
import { MoreSheetComponent } from '../more-sheet/more-sheet.component';

const PRIMARY_TAB_COUNT = 4;

@Component({
  selector:        'app-bottom-nav',
  standalone:      true,
  templateUrl:     './bottom-nav.component.html',
  styleUrls:       ['./bottom-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzIconModule, MoreSheetComponent],
})
export class BottomNavComponent {
  private router      = inject(Router);
  private permissions = inject(PermissionService);
  private auth        = inject(AuthService);

  moreOpen = signal(false);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private menuItems = computed<MenuItem[]>(() => {
    const roomId = this.auth.currentUser()?.roomId;
    return NAV_ITEMS.map(item =>
      item.route?.includes(':roomId') && roomId
        ? { ...item, route: item.route.replace(':roomId', roomId) }
        : item,
    );
  });

  private visibleItems = computed<MenuItem[]>(() =>
    this.menuItems().filter(item => !item.divider && canShowNavItem(item, this.menuItems(), {
      hasPermission: p => this.permissions.hasPermission(p),
      isAdmin:       this.auth.hasRole(UserRole.ADMIN),
      isTenant:      this.auth.hasRole(UserRole.TENANT),
    })),
  );

  primaryItems = computed(() => this.visibleItems().slice(0, PRIMARY_TAB_COUNT));
  moreItems    = computed(() => this.visibleItems().slice(PRIMARY_TAB_COUNT));

  isActive = (route?: string): boolean => {
    if (!route) return false;
    return this.currentUrl().startsWith(route);
  };

  isMoreActive = computed(() => this.moreItems().some(item => this.isActive(item.route)));

  navigate(route?: string): void {
    if (!route) return;
    this.router.navigateByUrl(route);
  }

  openMore(): void {
    this.moreOpen.set(true);
  }
}
