import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TenantsListComponent } from '../../../apps/cms/src/app/modules/tenants/tenants-list/tenants-list.component';
import { ApiService } from '../../../apps/cms/src/app/core/services/api.service';
import { ToastService } from '../../../apps/cms/src/app/shared/components/feedback/toast/toast.service';
import { LayoutService } from '../../../apps/cms/src/app/core/services/layout.service';

const row = (fullName: string, phone: string | null, roomNumber: string | null) =>
  ({ tenantId: fullName, fullName, phone, roomNumber } as any);

function createComponent() {
  TestBed.configureTestingModule({
    imports: [TenantsListComponent],
    providers: [
      { provide: ApiService, useValue: { get: () => ({ subscribe: () => {} }) } },
      { provide: ToastService, useValue: { error: () => {}, success: () => {} } },
      { provide: LayoutService, useValue: { isMobile: () => false } },
    ],
  });
  return TestBed.createComponent(TenantsListComponent).componentInstance;
}

describe('TenantsListComponent — search filter', () => {
  it('matches by name, phone, or room number — case-insensitively', () => {
    const c = createComponent();
    c.items.set([
      row('Nguyễn Văn A', '0901234567', '101'),
      row('Trần Thị B', '0987654321', '202'),
    ]);

    c.filterSearch.set('văn a');
    expect(c.filteredItems().map(t => t.fullName)).toEqual(['Nguyễn Văn A']);

    c.filterSearch.set('0987');
    expect(c.filteredItems().map(t => t.fullName)).toEqual(['Trần Thị B']);

    c.filterSearch.set('202');
    expect(c.filteredItems().map(t => t.fullName)).toEqual(['Trần Thị B']);
  });

  it('an empty search returns every tenant unfiltered', () => {
    const c = createComponent();
    c.items.set([row('A', null, null), row('B', null, null)]);
    c.filterSearch.set('');
    expect(c.filteredItems()).toHaveLength(2);
  });

  it('does not crash on a tenant with no phone/room (null-safe)', () => {
    const c = createComponent();
    c.items.set([row('Solo Tenant', null, null)]);
    c.filterSearch.set('solo');
    expect(c.filteredItems()).toHaveLength(1);
  });
});
