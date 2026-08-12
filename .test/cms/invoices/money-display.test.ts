import { describe, it, expect } from 'vitest';
import { MoneyDisplayComponent } from '../../../apps/cms/src/app/shared/components/display/money-display/money-display.component';

function display(value: number, opts: Partial<Pick<MoneyDisplayComponent, 'currency' | 'showSign' | 'short'>> = {}) {
  const c = new MoneyDisplayComponent();
  c.value = value;
  Object.assign(c, opts);
  return c.formatted;
}

describe('MoneyDisplayComponent — invoice amount formatting', () => {
  it('formats with Vietnamese thousand separators', () => {
    expect(display(2785000)).toBe('2.785.000 đ');
  });

  it('shows zero plainly, without a sign', () => {
    expect(display(0)).toBe('0 đ');
  });

  it('prefixes negative amounts with "-"', () => {
    expect(display(-50000)).toBe('-50.000 đ');
  });

  it('does not add "+" for positive values unless showSign is set', () => {
    expect(display(100000)).toBe('100.000 đ');
    expect(display(100000, { showSign: true })).toBe('+100.000 đ');
  });

  it('showSign never adds "+" to a negative value (the "-" already covers it)', () => {
    expect(display(-100000, { showSign: true })).toBe('-100.000 đ');
  });

  it('short form abbreviates to "Xtr" only at 1,000,000 and above', () => {
    expect(display(2785000, { short: true })).toBe('2,8tr đ');
    expect(display(999999, { short: true })).toBe('999.999 đ'); // below threshold: full form
  });
});
