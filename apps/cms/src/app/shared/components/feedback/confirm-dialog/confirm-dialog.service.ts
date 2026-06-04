import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';

export interface ConfirmOptions {
  title:    string;
  content?: string;
  okText?:  string;
  okDanger?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private modal = inject(NzModalService);

  confirm(opts: ConfirmOptions): Observable<boolean> {
    return new Observable(obs => {
      this.modal.confirm({
        nzTitle:        opts.title,
        nzContent:      opts.content,
        nzOkText:       opts.okText ?? 'Xác nhận',
        nzOkDanger:     opts.okDanger ?? false,
        nzCancelText:   'Hủy',
        nzOnOk:  () => { obs.next(true);  obs.complete(); },
        nzOnCancel: () => { obs.next(false); obs.complete(); },
      });
    });
  }

  confirmDelete(target: string): Observable<boolean> {
    return this.confirm({
      title:    `Xác nhận xóa ${target}?`,
      content:  'Hành động này không thể hoàn tác.',
      okText:   'Xóa',
      okDanger: true,
    });
  }
}
