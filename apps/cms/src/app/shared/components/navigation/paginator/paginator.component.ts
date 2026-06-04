import { ChangeDetectionStrategy, Component, computed, EventEmitter, Input, input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector:        'app-paginator',
  standalone:      true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule],
  template: `
    <div class="paginator">
      <span class="paginator__info">
        {{ from() }}–{{ to() }} / {{ total() }} mục
      </span>
      <div class="paginator__controls">
        <button class="paginator__btn" [disabled]="page() <= 1" (click)="go(1)">«</button>
        <button class="paginator__btn" [disabled]="page() <= 1" (click)="go(page() - 1)">‹</button>
        @for (p of pages(); track p) {
          <button class="paginator__btn" [class.active]="p === page()" (click)="go(p)">{{ p }}</button>
        }
        <button class="paginator__btn" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">›</button>
        <button class="paginator__btn" [disabled]="page() >= totalPages()" (click)="go(totalPages())">»</button>
      </div>
    </div>
  `,
  styles: [`
    .paginator {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0 0;
      gap: 12px;
      flex-wrap: wrap;
    }
    .paginator__info {
      font-size: 13px;
      color: var(--color-text-muted);
    }
    .paginator__controls {
      display: flex;
      gap: 4px;
    }
    .paginator__btn {
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      background: var(--color-bg-card);
      color: var(--color-text-secondary);
      font-size: 13px;
      font-family: var(--font-label, inherit);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;

      &:hover:not(:disabled):not(.active) {
        background: var(--color-bg-hover);
        border-color: var(--color-border-hover);
      }
      &.active {
        background: var(--color-primary);
        color: #fff;
        border-color: var(--color-primary);
        font-weight: 600;
      }
      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }
  `],
})
export class PaginatorComponent {
  total    = input.required<number>();
  page     = input.required<number>();
  pageSize = input<number>(10);

  @Output() pageChange = new EventEmitter<number>();

  totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  from       = computed(() => this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1);
  to         = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  pages = computed(() => {
    const tp = this.totalPages();
    const p  = this.page();
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, p - delta); i <= Math.min(tp, p + delta); i++) range.push(i);
    return range;
  });

  go(p: number): void {
    if (p < 1 || p > this.totalPages() || p === this.page()) return;
    this.pageChange.emit(p);
  }
}
