import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';

const QUARTERS = [
  { label: 'Quý 1 (T1–T3)', value: 1 },
  { label: 'Quý 2 (T4–T6)', value: 2 },
  { label: 'Quý 3 (T7–T9)', value: 3 },
  { label: 'Quý 4 (T10–T12)', value: 4 },
];

@Component({
  selector:        'app-quarter-picker',
  standalone:      true,
  template: `
    <div class="filter-field">
      <label class="filter-label">{{ label }}</label>
      <nz-select
        nzPlaceHolder="Chọn quý"
        nzAllowClear
        [(ngModel)]="value"
        (ngModelChange)="valueChange.emit($event)"
        style="min-width: 160px">
        @for (q of quarters; track q.value) {
          <nz-option [nzLabel]="q.label" [nzValue]="q.value" />
        }
      </nz-select>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzSelectModule],
})
export class QuarterPickerComponent {
  @Input() label = 'Quý';
  @Input() value: number | null = null;
  @Output() valueChange = new EventEmitter<number | null>();

  readonly quarters = QUARTERS;
}
