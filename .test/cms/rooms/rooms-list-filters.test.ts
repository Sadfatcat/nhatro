import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RoomsListComponent } from '../../../apps/cms/src/app/modules/rooms/rooms-list/rooms-list.component';
import { ApiService } from '../../../apps/cms/src/app/core/services/api.service';
import { ToastService } from '../../../apps/cms/src/app/shared/components/feedback/toast/toast.service';
import { LayoutService } from '../../../apps/cms/src/app/core/services/layout.service';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { RoomStatus } from '@nhatro/shared-types';

const row = (roomNumber: string, floor: number, price: number, status: RoomStatus = 'AVAILABLE') =>
  ({ roomId: `r-${roomNumber}`, roomNumber, floor, price, status, tenant: null });

function createComponent() {
  TestBed.configureTestingModule({
    imports: [RoomsListComponent],
    providers: [
      provideRouter([]),
      { provide: ApiService, useValue: { get: () => ({ subscribe: () => {} }) } },
      { provide: ToastService, useValue: { error: () => {}, success: () => {} } },
      { provide: LayoutService, useValue: { isMobile: () => false } },
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
    ],
  });
  return TestBed.createComponent(RoomsListComponent).componentInstance;
}

describe('RoomsListComponent — filters/sort (client-side)', () => {
  it('search matches room number case-insensitively', () => {
    const c = createComponent();
    c.items.set([row('101', 1, 1000000), row('202', 2, 1000000)]);
    c.filterSearch.set('20');
    expect(c.filteredItems().map(r => r.roomNumber)).toEqual(['202']);
  });

  it('floor filter narrows to the exact floor', () => {
    const c = createComponent();
    c.items.set([row('101', 1, 1), row('201', 2, 1), row('102', 1, 1)]);
    c.filterFloor.set(1);
    expect(c.filteredItems().map(r => r.roomNumber).sort()).toEqual(['101', '102']);
  });

  it('status filter narrows to the exact status', () => {
    const c = createComponent();
    c.items.set([row('101', 1, 1, 'OCCUPIED'), row('102', 1, 1, 'AVAILABLE')]);
    c.filterStatus.set('OCCUPIED');
    expect(c.filteredItems().map(r => r.roomNumber)).toEqual(['101']);
  });

  it('sort price-asc orders cheapest first', () => {
    const c = createComponent();
    c.items.set([row('101', 1, 3000000), row('102', 1, 1000000), row('103', 1, 2000000)]);
    c.filterSort.set('price-asc');
    expect(c.filteredItems().map(r => r.price)).toEqual([1000000, 2000000, 3000000]);
  });

  it('sort room-asc uses natural numeric ordering, not lexicographic ("9" before "10")', () => {
    const c = createComponent();
    c.items.set([row('10', 1, 1), row('9', 1, 1), row('2', 1, 1)]);
    c.filterSort.set('room-asc');
    expect(c.filteredItems().map(r => r.roomNumber)).toEqual(['2', '9', '10']);
  });

  it('floorOptions lists each distinct floor once, ascending', () => {
    const c = createComponent();
    c.items.set([row('101', 3, 1), row('102', 1, 1), row('103', 1, 1), row('104', 2, 1)]);
    expect(c.floorOptions().map(o => o.value)).toEqual([1, 2, 3]);
  });
});
