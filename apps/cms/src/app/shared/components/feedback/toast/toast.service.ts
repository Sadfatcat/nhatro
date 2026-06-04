import { Injectable, inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private msg = inject(NzMessageService);

  success(content: string): void { this.msg.success(content); }
  error(content: string): void   { this.msg.error(content); }
  info(content: string): void    { this.msg.info(content); }
  warning(content: string): void { this.msg.warning(content); }

  apiError(err: unknown): void {
    const message = (err as { message?: string })?.message ?? 'Đã có lỗi xảy ra, vui lòng thử lại.';
    this.msg.error(message);
  }
}
