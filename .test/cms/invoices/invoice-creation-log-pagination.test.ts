import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InvoiceCreationLogComponent } from '../../../apps/cms/src/app/modules/invoices/invoice-creation-log/invoice-creation-log.component';
import { ApiService } from '../../../apps/cms/src/app/core/services/api.service';
import { ToastService } from '../../../apps/cms/src/app/shared/components/feedback/toast/toast.service';
import { LayoutService } from '../../../apps/cms/src/app/core/services/layout.service';

function createComponent(getSpy = vi.fn((url: string) =>
  of(url === '/rooms' ? { success: true, data: [] } : { success: true, data: { items: [], total: 0 } }),
)) {
  TestBed.configureTestingModule({
    imports: [InvoiceCreationLogComponent],
    providers: [
      { provide: ApiService, useValue: { get: getSpy, post: vi.fn() } },
      { provide: ToastService, useValue: { error: () => {}, success: () => {} } },
      { provide: LayoutService, useValue: { isMobile: () => false } },
    ],
  });
  const fixture = TestBed.createComponent(InvoiceCreationLogComponent);
  return { fixture, component: fixture.componentInstance, getSpy };
}

describe('InvoiceCreationLogComponent — pagination + filters', () => {
  it('onPageChange updates page/pageSize signals and re-fetches with the new values', () => {
    const { component, getSpy } = createComponent();
    getSpy.mockClear();

    component.onPageChange({ page: 3, pageSize: 20 });

    expect(component.page()).toBe(3);
    expect(component.pageSize()).toBe(20);
    expect(getSpy).toHaveBeenCalledWith('/invoices', expect.objectContaining({ page: 3, pageSize: 20 }));
  });

  it('changing a filter resets back to page 1', () => {
    const { component } = createComponent();
    component.page.set(5);

    component.onFilterChange({ period: '2026-08', roomIds: null, notified: null });

    expect(component.page()).toBe(1);
  });

  it('onFilterChange with roomIds merges the selected rooms into the request as a CSV string', () => {
    const { component, getSpy } = createComponent();
    getSpy.mockClear();

    component.onFilterChange({ period: null, roomIds: ['r1', 'r2', 'r3'], notified: null });

    expect(getSpy).toHaveBeenCalledWith('/invoices', expect.objectContaining({ roomIds: 'r1,r2,r3' }));
  });

  it('notified filter "yes"/"no" maps to the string "true"/"false" sent to the API', () => {
    const { component, getSpy } = createComponent();

    component.onFilterChange({ period: null, roomIds: null, notified: 'yes' });
    expect(getSpy).toHaveBeenLastCalledWith('/invoices', expect.objectContaining({ notified: 'true' }));

    component.onFilterChange({ period: null, roomIds: null, notified: 'no' });
    expect(getSpy).toHaveBeenLastCalledWith('/invoices', expect.objectContaining({ notified: 'false' }));

    component.onFilterChange({ period: null, roomIds: null, notified: null });
    expect(getSpy).toHaveBeenLastCalledWith('/invoices', expect.objectContaining({ notified: null }));
  });
});
