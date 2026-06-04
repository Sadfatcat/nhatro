import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

@Component({
  selector:        'app-month-filter',
  standalone:      true,
  template: `
    <div class="filter-field">
      <label class="filter-label">{{ label }}</label>
      <nz-date-picker
        nzMode="month"
        nzFormat="MM/yyyy"
        nzPlaceHolder="Chọn tháng"
        nzAllowClear
        [(ngModel)]="value"
        (ngModelChange)="valueChange.emit($event)"
        style="min-width: 140px" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzDatePickerModule],
})
export class MonthFilterComponent {
  @Input() label = 'Tháng';
  @Input() value: Date | null = null;
  @Output() valueChange = new EventEmitter<Date | null>();
}
