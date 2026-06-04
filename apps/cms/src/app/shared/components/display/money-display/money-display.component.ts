import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-money-display',
  standalone:      true,
  template: `<span class="money" [class.negative]="value < 0" [class.zero]="value === 0">{{ formatted }}</span>`,
  styleUrls:       ['./money-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
})
export class MoneyDisplayComponent {
  @Input({ required: true }) value!: number;
  @Input() currency  = 'đ';
  @Input() showSign  = false;
  @Input() short     = false;

  get formatted(): string {
    const abs = Math.abs(this.value);
    let str: string;

    if (this.short && abs >= 1_000_000) {
      str = (abs / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'tr ' + this.currency;
    } else {
      str = abs.toLocaleString('vi-VN') + ' ' + this.currency;
    }

    if (this.value < 0) return '-' + str;
    if (this.showSign && this.value > 0) return '+' + str;
    return str;
  }
}
