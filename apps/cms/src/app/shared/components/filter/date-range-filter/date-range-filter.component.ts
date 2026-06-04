import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { DateRangeValue } from '../filter.types';

@Component({
  selector:        'app-date-range-filter',
  standalone:      true,
  template: `
    <div class="filter-field">
      <label class="filter-label">{{ label }}</label>
      <nz-range-picker
        nzFormat="dd/MM/yyyy"
        [nzPlaceHolder]="['Từ ngày', 'Đến ngày']"
        nzAllowClear
        [(ngModel)]="rawValue"
        (ngModelChange)="onRangeChange($event)"
        style="min-width: 230px" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzDatePickerModule],
})
export class DateRangeFilterComponent {
  @Input() label    = 'Khoảng thời gian';
  @Input() value: DateRangeValue = { from: null, to: null };

  @Output() valueChange = new EventEmitter<DateRangeValue>();

  rawValue: [Date, Date] | null = null;

  onRangeChange(range: [Date, Date] | null): void {
    this.valueChange.emit(range ? { from: range[0], to: range[1] } : { from: null, to: null });
  }
}
