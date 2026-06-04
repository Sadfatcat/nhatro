import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

@Component({
  selector:        'app-month-picker',
  standalone:      true,
  template: `
    <nz-date-picker
      nzMode="month"
      nzFormat="MM/yyyy"
      [nzPlaceHolder]="placeholder"
      [nzAllowClear]="allowClear"
      [(ngModel)]="value"
      (ngModelChange)="valueChange.emit($event)"
      style="width: 100%" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzDatePickerModule],
})
export class MonthPickerComponent {
  @Input() placeholder = 'Chọn tháng';
  @Input() allowClear  = true;
  @Input() value: Date | null = null;

  @Output() valueChange = new EventEmitter<Date | null>();
}
