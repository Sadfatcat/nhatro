import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PaginatorComponent } from '../../../apps/cms/src/app/shared/components/navigation/paginator/paginator.component';

function create(total: number, page: number, pageSize = 10) {
  const fixture = TestBed.createComponent(PaginatorComponent);
  fixture.componentRef.setInput('total', total);
  fixture.componentRef.setInput('page', page);
  fixture.componentRef.setInput('pageSize', pageSize);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('PaginatorComponent', () => {
  it('"from"/"to" reflect the visible range on a full middle page', () => {
    const c = create(95, 3, 10);
    expect(c.from()).toBe(21);
    expect(c.to()).toBe(30);
  });

  it('the last page clamps "to" to the true total, not a full page size', () => {
    const c = create(95, 10, 10);
    expect(c.from()).toBe(91);
    expect(c.to()).toBe(95);
  });

  it('zero items: "from" is 0, not 1 (avoids showing "1–0 / 0 mục")', () => {
    const c = create(0, 1, 10);
    expect(c.from()).toBe(0);
    expect(c.to()).toBe(0);
  });

  it('totalPages is at least 1 even with zero items (never 0 pages)', () => {
    const c = create(0, 1, 10);
    expect(c.totalPages()).toBe(1);
  });

  it('go() ignores out-of-range and no-op page numbers — never emits invalid pages', () => {
    const c = create(50, 3, 10);
    const emitted: number[] = [];
    c.pageChange.subscribe(p => emitted.push(p));

    c.go(0);   // below range
    c.go(99);  // above range (totalPages = 5)
    c.go(3);   // same as current page
    c.go(4);   // valid

    expect(emitted).toEqual([4]);
  });

  it('pages() windows ±2 around the current page, clamped to [1, totalPages]', () => {
    const c = create(200, 10, 10); // totalPages = 20
    expect(c.pages()).toEqual([8, 9, 10, 11, 12]);
  });

  it('pages() near the start does not produce numbers below 1', () => {
    const c = create(200, 1, 10);
    expect(c.pages()).toEqual([1, 2, 3]);
  });
});
