import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

export type DateRange = [Date, Date] | null;

@Component({
  selector:        'app-date-range-picker',
  standalone:      true,
  template: `
    <nz-range-picker
      nzFormat="dd/MM/yyyy"
      [nzPlaceHolder]="[startPlaceholder, endPlaceholder]"
      [nzAllowClear]="allowClear"
      [(ngModel)]="value"
      (ngModelChange)="valueChange.emit($event)"
      style="width: 100%" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzDatePickerModule],
})
export class DateRangePickerComponent {
  @Input() startPlaceholder = 'Từ ngày';
  @Input() endPlaceholder   = 'Đến ngày';
  @Input() allowClear       = true;
  @Input() value: DateRange  = null;

  @Output() valueChange = new EventEmitter<DateRange>();
}
