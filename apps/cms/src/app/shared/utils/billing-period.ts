const LAST_DAY_OF_PREVIOUS_PERIOD = 10;

/** Billing period runs 11th of month N to 10th of month N+1; returns the "YYYY-MM" of month N. */
export function currentBillingPeriod(now = new Date()): string {
  const monthOffset = now.getDate() <= LAST_DAY_OF_PREVIOUS_PERIOD ? -1 : 0;
  return monthKeyDirect(new Date(now.getFullYear(), now.getMonth() + monthOffset, 1));
}

/** Oldest-first list of the last `count` periods, ending with the current one. */
export function lastNBillingPeriods(count: number, now = new Date()): string[] {
  const [year, month] = currentBillingPeriod(now).split('-').map(Number);
  return Array.from({ length: count }, (_, i) => monthKeyDirect(new Date(year, month - 1 - (count - 1 - i), 1)));
}

/** "YYYY-MM" of the date's own month, without the 11→10 shift (for months picked by hand). */
export function monthKeyDirect(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function periodToDate(period: string): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1);
}
