import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector:        'app-modal',
  standalone:      true,
  templateUrl:     './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzModalModule, NzButtonModule],
})
export class ModalComponent {
  @Input() visible  = false;
  @Input() title    = '';
  @Input() width    = 520;
  @Input() loading  = false;
  @Input() okText   = 'Xác nhận';
  @Input() cancelText = 'Hủy';
  @Input() showFooter = true;
  @Input() okDanger = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() ok     = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onOk(): void     { this.ok.emit(); }
  onCancel(): void { this.visible = false; this.visibleChange.emit(false); this.cancel.emit(); }
}
