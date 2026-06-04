import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyVn', standalone: true })
export class CurrencyVnPipe implements PipeTransform {
  transform(value: number | null | undefined, showSymbol = true): string {
    if (value === null || value === undefined) return '—';
    const formatted = new Intl.NumberFormat('vi-VN').format(value);
    return showSymbol ? `${formatted} ₫` : formatted;
  }
}
