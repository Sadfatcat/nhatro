import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector:        'app-error-state',
  standalone:      true,
  template: `
    <nz-result
      nzStatus="error"
      [nzTitle]="title"
      [nzSubTitle]="subtitle">
      @if (retryLabel) {
        <div nz-result-extra>
          <button nz-button nzType="primary" (click)="retry.emit()">{{ retryLabel }}</button>
        </div>
      }
    </nz-result>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzResultModule, NzButtonModule],
})
export class ErrorStateComponent {
  @Input() title       = 'Đã có lỗi xảy ra';
  @Input() subtitle    = 'Vui lòng thử lại sau.';
  @Input() retryLabel?: string;

  @Output() retry = new EventEmitter<void>();
}
