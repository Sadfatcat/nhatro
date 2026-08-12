import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ContractsComponent } from '../../../apps/cms/src/app/modules/contracts/contracts.component';
import { ApiService } from '../../../apps/cms/src/app/core/services/api.service';
import { AuthService } from '../../../apps/cms/src/app/core/auth/services/auth.service';
import { PermissionService } from '../../../apps/cms/src/app/core/permission/services/permission.service';
import { ToastService } from '../../../apps/cms/src/app/shared/components/feedback/toast/toast.service';
import { LayoutService } from '../../../apps/cms/src/app/core/services/layout.service';
import { ContractStatus } from '@nhatro/shared-types';

const row = (status: ContractStatus, roomNumber = '101') => ({
  id: `c-${roomNumber}-${status}`, roomId: 'r1', tenantId: 't1',
  startDate: '2026-01-01', deposit: 0, status, notes: null, createdAt: '2026-01-01', filePath: null,
  room: { roomId: 'r1', roomNumber, floor: 1, price: 1000000 },
  tenant: { tenantId: 't1', fullName: 'A', phone: null, dateOfBirth: null, hometown: null, nationalId: null },
});

function createComponent() {
  TestBed.configureTestingModule({
    imports: [ContractsComponent],
    providers: [
      { provide: ApiService, useValue: { get: () => of({ success: true, data: [] }) } },
      { provide: AuthService, useValue: { currentUser: () => null } },
      { provide: PermissionService, useValue: { hasPermission: () => true } },
      { provide: ToastService, useValue: { error: () => {}, success: () => {} } },
      { provide: LayoutService, useValue: { isMobile: () => false } },
    ],
  });
  const fixture = TestBed.createComponent(ContractsComponent);
  return fixture.componentInstance;
}

describe('ContractsComponent — tabs (đang hiệu lực / đã kết thúc)', () => {
  it('counts ACTIVE separately from EXPIRED+TERMINATED', () => {
    const c = createComponent();
    c.contracts.set([row('ACTIVE', '101'), row('ACTIVE', '102'), row('EXPIRED', '103'), row('TERMINATED', '104')]);
    expect(c.activeCount()).toBe(2);
    expect(c.endedCount()).toBe(2);
  });

  it('tab 0 (default) shows only ACTIVE contracts', () => {
    const c = createComponent();
    c.contracts.set([row('ACTIVE', '101'), row('EXPIRED', '102'), row('TERMINATED', '103')]);
    expect(c.filteredContracts().map(r => r.status)).toEqual(['ACTIVE']);
  });

  it('tab 1 shows EXPIRED and TERMINATED together, not ACTIVE', () => {
    const c = createComponent();
    c.contracts.set([row('ACTIVE', '101'), row('EXPIRED', '102'), row('TERMINATED', '103')]);
    c.onTabChange(1);
    const statuses = c.filteredContracts().map(r => r.status).sort();
    expect(statuses).toEqual(['EXPIRED', 'TERMINATED']);
  });

  it('switching tabs resets pagination back to page 1', () => {
    const c = createComponent();
    c.contracts.set(Array.from({ length: 25 }, (_, i) => row('ACTIVE', String(100 + i))));
    c.page.set(3);
    c.onTabChange(1);
    expect(c.page()).toBe(1);
  });

  it('search filter applies on top of the active tab, not across both', () => {
    const c = createComponent();
    c.contracts.set([row('ACTIVE', '999'), row('TERMINATED', '999')]);
    c.filterSearch.set('999');
    // Tab 0 (ACTIVE only): the TERMINATED "999" row must not leak through even though it matches search
    expect(c.filteredContracts()).toHaveLength(1);
    expect(c.filteredContracts()[0].status).toBe('ACTIVE');
  });
});
