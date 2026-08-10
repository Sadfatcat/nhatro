import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthState, LoginDto, USER_ROLE_LABELS, UserRole } from '../auth.types';
import { AuthStorageService } from './auth-storage.service';
import { ROLE_PERMISSIONS } from '../../permission/policies/role-permissions';
import { Permission } from '../../permission/policies/role-permissions';
import { ApiService } from '../../services/api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private mockStorage = inject(AuthStorageService);
  private api = inject(ApiService);

  authState       = signal<AuthState>(this.mockStorage.getState());
  currentUser     = computed(() => this.authState().user);
  token           = computed(() => this.authState().token);
  role            = computed(() => this.authState().role);
  isAuthenticated = computed(() => this.authState().isAuthenticated);
  roleLabel       = computed(() => this.role() ? USER_ROLE_LABELS[this.role()!] : '');

  hasRole(role: UserRole | string): boolean {
    return this.role() === role;
  }

  hasAnyRole(...roles: Array<UserRole | string>): boolean {
    return roles.some(r => this.hasRole(r));
  }

  hasPermission(permission: Permission | string): boolean {
    const role = this.role();
    return role ? (ROLE_PERMISSIONS[role] ?? []).includes(permission as Permission) : false;
  }

  hasAllPermissions(...perms: Array<Permission | string>): boolean {
    return perms.every(p => this.hasPermission(p));
  }

  defaultRoute(): string {
    if (this.hasAnyRole(UserRole.ADMIN, UserRole.LANDLORD)) return '/app/management-home';
    if (this.hasRole(UserRole.TENANT)) return '/app/home';
    return '/app/rooms';
  }

  login(credentials: LoginDto): Observable<void> {
    return this.api.post<AuthState>('/auth/login', credentials).pipe(
      tap(state => this.authState.set(this.mockStorage.saveState(state))),
      map(() => void 0),
    );
  }

  logout(): void {
    this.mockStorage.clearState();
    this.authState.set(this.mockStorage.unauthenticatedState());
  }
}
