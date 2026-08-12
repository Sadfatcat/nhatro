import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthStorageService } from '../../../apps/cms/src/app/core/auth/services/auth-storage.service';
import { UserRole } from '@nhatro/shared-types';

describe('AuthStorageService — session expiry (client-side safety net)', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  function service(): AuthStorageService {
    return TestBed.inject(AuthStorageService);
  }

  it('a saved state that has not expired yet is returned as authenticated', () => {
    const svc = service();
    const future = new Date(Date.now() + 60_000).toISOString();
    svc.saveState({ user: { role: UserRole.TENANT } as any, token: 'tok', expiresAt: future, isAuthenticated: true, role: UserRole.TENANT });

    const state = svc.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('tok');
  });

  it('an expired saved state is treated as logged out and wiped from storage', () => {
    const svc = service();
    const past = new Date(Date.now() - 60_000).toISOString();
    svc.saveState({ user: { role: UserRole.TENANT } as any, token: 'tok', expiresAt: past, isAuthenticated: true, role: UserRole.TENANT });

    const state = svc.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(localStorage.getItem('auth_state')).toBeNull();
  });

  it('with nothing saved at all, returns the unauthenticated state', () => {
    const state = service().getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('a saved state with no expiresAt is treated as invalid (fails closed, not open)', () => {
    const svc = service();
    localStorage.setItem('auth_state', JSON.stringify({ user: {}, token: 'tok', isAuthenticated: true }));
    const state = svc.getState();
    expect(state.isAuthenticated).toBe(false);
  });

  it('clearState removes the auth state and legacy leftover keys', () => {
    const svc = service();
    localStorage.setItem('auth_state', '{}');
    localStorage.setItem('access_token', 'x');
    localStorage.setItem('refresh_token', 'y');
    localStorage.setItem('current_user', 'z');

    svc.clearState();

    expect(localStorage.getItem('auth_state')).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('current_user')).toBeNull();
  });
});
