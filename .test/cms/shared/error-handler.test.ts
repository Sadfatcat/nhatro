import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ErrorHandlerService } from '../../../apps/cms/src/app/core/errors/error.handler';
import { AuthService } from '../../../apps/cms/src/app/core/auth/services/auth.service';
import { ValidationErrorService } from '../../../apps/cms/src/app/core/services/validation-error.service';

function setup() {
  const logout = vi.fn();
  const navigate = vi.fn();
  const errorMsg = vi.fn();
  const warningMsg = vi.fn();

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { logout } },
      { provide: NzMessageService, useValue: { error: errorMsg, warning: warningMsg } },
      { provide: ValidationErrorService, useValue: { push: vi.fn() } },
    ],
  });
  const svc = TestBed.inject(ErrorHandlerService);
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockImplementation(navigate as any);
  return { svc, logout, navigate, errorMsg, warningMsg, router };
}

describe('ErrorHandlerService — this is what actually enforces "kicked out on invalid session"', () => {
  it('401 on a normal API call: logs out and redirects to /login (regression guard for the JWT/AuthGuard fix)', () => {
    const { svc, logout, navigate } = setup();
    svc.handle(new HttpErrorResponse({ status: 401, url: '/api/contracts' }));
    expect(logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('401 specifically from the login endpoint itself: shows a wrong-credentials message, does NOT log out/redirect', () => {
    const { svc, logout, navigate, errorMsg } = setup();
    svc.handle(new HttpErrorResponse({ status: 401, url: '/api/auth/login' }));
    expect(logout).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(errorMsg).toHaveBeenCalledWith('Tên đăng nhập hoặc mật khẩu không đúng.');
  });

  it('403 (insufficient role — the RolesGuard case) redirects to /403, does NOT log the user out', () => {
    const { svc, logout, navigate } = setup();
    svc.handle(new HttpErrorResponse({ status: 403, url: '/api/accounts' }));
    expect(logout).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/403']);
  });

  it('400 with field errors pushes them to ValidationErrorService', () => {
    const { svc, warningMsg } = setup();
    svc.handle(new HttpErrorResponse({
      status: 400,
      error: { message: 'Dữ liệu không hợp lệ.', errors: { password: ['Quá ngắn'] } },
    }));
    expect(warningMsg).toHaveBeenCalledWith('Dữ liệu không hợp lệ.');
  });

  it('status 0 (no network) shows a connectivity message, not a generic server error', () => {
    const { svc, errorMsg } = setup();
    svc.handle(new HttpErrorResponse({ status: 0 }));
    expect(errorMsg).toHaveBeenCalledWith('Không có kết nối mạng. Vui lòng kiểm tra lại.');
  });
});
