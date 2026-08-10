import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AuthService } from '../auth/services/auth.service';
import { ValidationErrorService } from '../services/validation-error.service';

@Injectable({ providedIn: 'root' })
export class ErrorHandlerService {
  private msg      = inject(NzMessageService);
  private router   = inject(Router);
  private auth     = inject(AuthService);
  private valError = inject(ValidationErrorService);

  handle(err: HttpErrorResponse): void {
    switch (err.status) {
      case 0:
        this.msg.error('Không có kết nối mạng. Vui lòng kiểm tra lại.');
        break;
      case 400:
        this.handleValidation(err);
        break;
      case 401:
        if (this.router.url.startsWith('/login') || err.url?.includes('/auth/login')) {
          this.msg.error('Tên đăng nhập hoặc mật khẩu không đúng.');
        } else {
          this.auth.logout();
          this.router.navigate(['/login']);
        }
        break;
      case 403:
        this.router.navigate(['/403']);
        break;
      case 404:
        this.msg.error('Không tìm thấy tài nguyên yêu cầu.');
        break;
      case 422:
        this.handleValidation(err);
        break;
      case 500:
        this.msg.error('Lỗi máy chủ nội bộ. Vui lòng thử lại sau.');
        break;
      default:
        this.msg.error(`Đã có lỗi xảy ra (${err.status}). Vui lòng thử lại.`);
    }
  }

  private handleValidation(err: HttpErrorResponse): void {
    const errors: Record<string, string[]> = err.error?.errors ?? {};
    if (Object.keys(errors).length > 0) {
      this.valError.push(errors);
    }
    const message = err.error?.message ?? 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    this.msg.warning(message);
  }
}
