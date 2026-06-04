import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: 'date' | 'datetime' | 'time' = 'datetime'): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '—';

    const pad = (n: number) => String(n).padStart(2, '0');
    const d   = pad(date.getDate());
    const mo  = pad(date.getMonth() + 1);
    const y   = date.getFullYear();
    const h   = pad(date.getHours());
    const mi  = pad(date.getMinutes());

    if (format === 'date')     return `${d}/${mo}/${y}`;
    if (format === 'time')     return `${h}:${mi}`;
    return `${d}/${mo}/${y} ${h}:${mi}`;
  }
}
