import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InvoicesByBillingDayComponent } from '../../../apps/cms/src/app/modules/invoices/invoices-by-billing-day/invoices-by-billing-day.component';
import { ApiService } from '../../../apps/cms/src/app/core/services/api.service';
import { ToastService } from '../../../apps/cms/src/app/shared/components/feedback/toast/toast.service';
import { LayoutService } from '../../../apps/cms/src/app/core/services/layout.service';

const row = (roomId: string, overrides: Record<string, unknown> = {}) => ({
  roomId, roomNumber: roomId, tenantName: 'A', invoiceId: `inv-${roomId}`,
  invoiceStatus: 'SENT' as const, totalAmount: 100, dueDate: '2026-08-20',
  mergedInvoiceId: null, sent: false, lastFailReason: null, ...overrides,
});

const batch = (id: string, rooms: ReturnType<typeof row>[]) => ({ id, period: '2026-09', closedAt: '2026-10-08T08:15:00.000Z', rooms });

function createComponent(overrides: { post?: ReturnType<typeof vi.fn>; toast?: Record<string, unknown> } = {}) {
  const post  = overrides.post ?? vi.fn().mockReturnValue(of({ success: true, data: { sent: 0, failed: [] } }));
  const toast = overrides.toast ?? { error: vi.fn(), success: vi.fn() };
  TestBed.configureTestingModule({
    imports: [InvoicesByBillingDayComponent],
    providers: [
      { provide: ApiService, useValue: { get: () => of({ success: true, data: { items: [], total: 0 } }), post } },
      { provide: ToastService, useValue: toast },
      { provide: LayoutService, useValue: { isMobile: () => false } },
    ],
  });
  const component = TestBed.createComponent(InvoicesByBillingDayComponent).componentInstance;
  (component as any).confirmDialog = { confirm: () => of(true) };
  return { component, post, toast };
}

describe('InvoicesByBillingDayComponent — batch tiers', () => {
  it('splits a batch into unsent, sent and merged tiers; merged rooms never appear in the send tiers', () => {
    const { component } = createComponent();
    component.batches.set([batch('b1', [
      row('r1'), row('r2', { sent: true }), row('r3', { mergedInvoiceId: 'm1' }), row('r4', { mergedInvoiceId: 'm1', sent: true }),
    ])]);

    const [view] = component.batchViews();

    expect(view.unsentRows.map(r => r.roomId)).toEqual(['r1']);
    expect(view.sentRows.map(r => r.roomId)).toEqual(['r2']);
    expect(view.mergedRows.map(r => r.roomId)).toEqual(['r3', 'r4']);
  });

  it('only the unsent tier is selectable', () => {
    const { component } = createComponent();
    component.batches.set([batch('b1', [row('r1')])]);

    const [view] = component.batchViews();

    expect(view.unsentConfig.selectable).toBe(true);
    expect(view.sentConfig.selectable).toBe(false);
    expect(view.mergedConfig.selectable).toBe(false);
  });

  it('formats the title period as MM/YYYY', () => {
    const { component } = createComponent();
    component.batches.set([batch('b1', [])]);

    expect(component.batchViews()[0].periodLabel).toBe('09/2026');
  });
});

describe('InvoicesByBillingDayComponent — table configs as memoized computed (regression: selection must survive unrelated CD ticks)', () => {
  it('returns the SAME views on repeated reads when nothing changed', () => {
    const { component } = createComponent();
    component.batches.set([batch('b1', [row('r1')])]);

    expect(component.batchViews()).toBe(component.batchViews());
  });

  it('does NOT recompute when saving, loading or a selection changes', () => {
    const { component } = createComponent();
    component.batches.set([batch('b1', [row('r1')])]);
    const before = component.batchViews();

    component.saving.set(true);
    component.loading.set(true);
    component.onSelectChange('b1', [row('r1')]);

    expect(component.batchViews()).toBe(before);
  });

  it('DOES recompute when the batches are reloaded', () => {
    const { component } = createComponent();
    component.batches.set([batch('b1', [row('r1')])]);
    const before = component.batchViews();

    component.batches.set([batch('b1', [row('r1'), row('r2')])]);

    expect(component.batchViews()).not.toBe(before);
    expect(component.batchViews()[0].unsentConfig.data).toHaveLength(2);
  });
});

describe('InvoicesByBillingDayComponent — bulk send', () => {
  it('sendSelected sends only the ticked rooms of that batch, not the whole tier', () => {
    const { component, post } = createComponent();
    component.batches.set([batch('b1', [row('r1'), row('r2'), row('r3')]), batch('b2', [row('s1')])]);
    const [view] = component.batchViews();

    component.onSelectChange('b1', [row('r1'), row('r3')]);
    component.sendSelected(view);

    expect(post).toHaveBeenCalledWith('/notifications/send-bulk', { invoiceIds: ['inv-r1', 'inv-r3'] });
  });

  it('sendAllUnsent sends every unsent room with an invoice and skips rooms without one', () => {
    const { component, post } = createComponent();
    component.batches.set([batch('b1', [row('r1'), row('r2', { invoiceId: null }), row('r3', { sent: true })])]);

    component.sendAllUnsent(component.batchViews()[0]);

    expect(post).toHaveBeenCalledWith('/notifications/send-bulk', { invoiceIds: ['inv-r1'] });
  });

  it('refuses when none of the rooms has an invoice yet', () => {
    const { component, post, toast } = createComponent();
    component.batches.set([batch('b1', [row('r1', { invoiceId: null })])]);

    component.sendAllUnsent(component.batchViews()[0]);

    expect(post).not.toHaveBeenCalled();
    expect(toast['error']).toHaveBeenCalled();
  });

  it('does not send when the user cancels the confirmation', () => {
    const { component, post } = createComponent();
    (component as any).confirmDialog = { confirm: () => of(false) };
    component.batches.set([batch('b1', [row('r1')])]);

    component.sendAllUnsent(component.batchViews()[0]);

    expect(post).not.toHaveBeenCalled();
  });

  it('reports failed rooms by room number with the reason, and reloads the batches', () => {
    const post = vi.fn().mockReturnValue(of({ success: true, data: { sent: 1, failed: [{ invoiceId: 'inv-r2', reason: 'no phone' }] } }));
    const { component, toast } = createComponent({ post });
    const loadData = vi.spyOn(component, 'loadData').mockImplementation(() => {});
    component.batches.set([batch('b1', [row('r1'), row('r2')])]);

    component.sendAllUnsent(component.batchViews()[0]);

    expect(toast['error']).toHaveBeenCalledWith(expect.stringContaining('P.r2: no phone'));
    expect(loadData).toHaveBeenCalled();
  });
});
