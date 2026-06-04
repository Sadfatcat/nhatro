import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../services/storage.service';
import { AuthState, UserRole } from '../auth.types';

const AUTH_STATE_KEY = 'mock_auth_state';

@Injectable({ providedIn: 'root' })
export class MockAuthStorageService {
  private storage = inject(StorageService);

  getState(): AuthState {
    const state = this.storage.get<AuthState>(AUTH_STATE_KEY);
    if (!state?.token || !state.expiresAt || Date.now() >= new Date(state.expiresAt).getTime()) {
      this.clearState();
      return this.guestState();
    }
    return { ...state, isAuthenticated: true, role: state.user?.role ?? UserRole.GUEST };
  }

  saveState(state: AuthState): AuthState {
    this.storage.set(AUTH_STATE_KEY, state);
    return state;
  }

  clearState(): void {
    this.storage.remove(AUTH_STATE_KEY);
    this.storage.remove('access_token');
    this.storage.remove('refresh_token');
    this.storage.remove('current_user');
  }

  guestState(): AuthState {
    return {
      user: null,
      token: null,
      expiresAt: null,
      isAuthenticated: false,
      role: UserRole.GUEST,
    };
  }
}
