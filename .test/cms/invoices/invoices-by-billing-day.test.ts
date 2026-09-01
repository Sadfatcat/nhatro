import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InvoicesByBillingDayComponent } from '../../../apps/cms/src/app/modules/invoices/invoices-by-billing-day/invoices-by-billing-day.component';
import { ApiService } from '../../../apps/cms/src/app/core/services/api.service';
import { ToastService } from '../../../apps/cms/src/app/shared/components/feedback/toast/toast.service';
import { LayoutService } from '../../../apps/cms/src/app/core/services/layout.service';

function createComponent() {
  TestBed.configureTestingModule({
    imports: [InvoicesByBillingDayComponent],
    providers: [
      { provide: ApiService, useValue: { get: () => of({ success: true, data: [] }), post: vi.fn() } },
      { provide: ToastService, useValue: { error: () => {}, success: () => {} } },
      { provide: LayoutService, useValue: { isMobile: () => false } },
    ],
  });
  const fixture = TestBed.createComponent(InvoicesByBillingDayComponent);
  return fixture.componentInstance;
}

const row = (roomId: string) => ({
  roomId, roomNumber: roomId, tenantName: 'A', invoiceId: `inv-${roomId}`,
  invoiceStatus: 'SENT' as const, totalAmount: 100, dueDate: '2026-08-20',
});

describe('InvoicesByBillingDayComponent — expand/collapse + multi-select', () => {
  it('collapses by default, per group — table still receives ALL rows (select-all must cover the whole group)', () => {
    const c = createComponent();
    c.rows15.set(Array.from({ length: 8 }, (_, i) => row(`r${i}`)));
    expect(c.expanded15()).toBe(false);
    expect(c.tableConfig15().data).toHaveLength(8);
  });

  it('toggleExpanded15 flips the expand flag for the "ngày 15" group only', () => {
    const c = createComponent();
    c.rows15.set(Array.from({ length: 8 }, (_, i) => row(`r${i}`)));
    c.rows30.set(Array.from({ length: 8 }, (_, i) => row(`s${i}`)));

    c.toggleExpanded15();

    expect(c.expanded15()).toBe(true);
    expect(c.expanded30()).toBe(false); // untouched
  });

  it('toggling back collapses again', () => {
    const c = createComponent();
    c.toggleExpanded15();
    c.toggleExpanded15();
    expect(c.expanded15()).toBe(false);
  });

  it('selectedRooms merges selections from BOTH the ngày-15 and ngày-30 groups', () => {
    const c = createComponent();
    c.onSelectChange15([row('r1'), row('r2')]);
    c.onSelectChange30([row('s1')]);

    expect(c.selectedRooms().map(r => r.roomId)).toEqual(['r1', 'r2', 's1']);
  });

  it('bulkSend sends the merged invoiceIds from both groups in one request', () => {
    const c = createComponent();
    const post = vi.fn().mockReturnValue(of({ success: true, data: { sent: 2, failed: [] } }));
    (c as any).api = { get: () => of({ success: true, data: [] }), post };

    c.onSelectChange15([row('r1')]);
    c.onSelectChange30([row('s1')]);
    c.bulkSend();

    expect(post).toHaveBeenCalledWith('/notifications/send-bulk', { invoiceIds: ['inv-r1', 'inv-s1'] });
  });

  it('bulkSend refuses when none of the selected rooms have an invoice yet this period', () => {
    const c = createComponent();
    const post = vi.fn();
    const toastError = vi.fn();
    (c as any).api = { get: () => of({ success: true, data: [] }), post };
    (c as any).toast = { error: toastError, success: vi.fn() };

    c.onSelectChange15([{ ...row('r1'), invoiceId: null }]);
    c.bulkSend();

    expect(post).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalled();
  });
});

describe('InvoicesByBillingDayComponent — tableConfig15/tableConfig30 as memoized computed signals (regression: selection must survive unrelated CD ticks)', () => {
  it('returns the SAME reference on repeated reads when nothing it depends on changed', () => {
    const c = createComponent();
    c.rows15.set([row('r1')]);

    const first  = c.tableConfig15();
    const second = c.tableConfig15();

    expect(second).toBe(first);
  });

  it('does NOT recompute when an unrelated signal changes (saving, selection, expanded)', () => {
    const c = createComponent();
    c.rows15.set([row('r1')]);
    const before = c.tableConfig15();

    c.saving.set(true);
    c.onSelectChange15([row('r1')]);
    c.toggleExpanded15();

    expect(c.tableConfig15()).toBe(before);
  });

  it('changing rows30/loading does not affect tableConfig15\'s reference (independent groups)', () => {
    const c = createComponent();
    c.rows15.set([row('r1')]);
    const before = c.tableConfig15();

    c.rows30.set([row('s1')]);

    expect(c.tableConfig15()).toBe(before);
  });

  it('DOES recompute (new reference) when rows15 itself changes', () => {
    const c = createComponent();
    c.rows15.set([row('r1')]);
    const before = c.tableConfig15();

    c.rows15.set([row('r1'), row('r2')]);

    expect(c.tableConfig15()).not.toBe(before);
    expect(c.tableConfig15().data).toHaveLength(2);
  });

  it('DOES recompute when loading toggles, since buildTableConfig reads loading()', () => {
    const c = createComponent();
    c.rows15.set([row('r1')]);
    const before = c.tableConfig15();

    c.loading.set(true);

    expect(c.tableConfig15()).not.toBe(before);
  });

  it('tableConfig30 is independently memoized the same way', () => {
    const c = createComponent();
    c.rows30.set([row('s1')]);
    const before = c.tableConfig30();

    c.saving.set(true);

    expect(c.tableConfig30()).toBe(before);
  });
});
