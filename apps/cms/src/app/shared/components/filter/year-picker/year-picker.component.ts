import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
  selector:        'app-year-picker',
  standalone:      true,
  template: `
    <div class="filter-field">
      <label class="filter-label">{{ label }}</label>
      <nz-select
        nzPlaceHolder="Chọn năm"
        nzAllowClear
        [(ngModel)]="value"
        (ngModelChange)="valueChange.emit($event)"
        style="min-width: 110px">
        @for (y of years; track y) {
          <nz-option [nzLabel]="y + ''" [nzValue]="y" />
        }
      </nz-select>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzSelectModule],
})
export class YearPickerComponent {
  @Input() label     = 'Năm';
  @Input() minYear   = new Date().getFullYear() - 3;
  @Input() maxYear   = new Date().getFullYear();
  @Input() value: number | null = null;

  @Output() valueChange = new EventEmitter<number | null>();

  get years(): number[] {
    const result: number[] = [];
    for (let y = this.maxYear; y >= this.minYear; y--) result.push(y);
    return result;
  }
}
