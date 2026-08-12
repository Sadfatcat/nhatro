import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ContentChild,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  TemplateRef,
} from '@angular/core';

export interface CellContext<T> {
  $implicit: unknown;
  row: T;
}
import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { PageChangeEvent, SortEvent, TableAction, TableConfig } from './data-table.model';
import { LayoutService } from '../../../../core/services/layout.service';
import { PaginatorComponent } from '../../navigation/paginator/paginator.component';

@Component({
  selector:        'app-data-table',
  standalone:      true,
  templateUrl:     './data-table.component.html',
  styleUrls:       ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgTemplateOutlet,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
    NzDropDownModule,
    NzTooltipModule,
    NzEmptyModule,
    PaginatorComponent,
  ],
})
export class DataTableComponent<T extends Record<string, unknown>> implements OnChanges {
  layout = inject(LayoutService);

  @Input() config!: TableConfig<T>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() cellTemplates: Record<string, TemplateRef<any>> = {};
  @ContentChild('cellTemplate') cellTemplateRef?: TemplateRef<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ContentChild('mobileCard') mobileCardTpl?: TemplateRef<any>;

  @Output() sortChange   = new EventEmitter<SortEvent>();
  @Output() pageChange   = new EventEmitter<PageChangeEvent>();
  @Output() selectChange = new EventEmitter<T[]>();
  @Output() rowClick     = new EventEmitter<T>();

  selectedKeys = signal<Set<unknown>>(new Set());

  visibleColumns = computed(() =>
    (this.config?.columns ?? []).filter(c => !c.hide),
  );

  ngOnChanges(): void {
    // reset selection when data changes
    this.selectedKeys.set(new Set());
  }

  onSort(column: string, direction: 'ascend' | 'descend' | null): void {
    this.sortChange.emit({ column, direction });
  }

  onPageChange(page: number): void {
    const ps = this.config.pagination?.pageSize ?? 10;
    this.pageChange.emit({ page, pageSize: ps });
  }

  onPageSizeChange(pageSize: number): void {
    this.pageChange.emit({ page: 1, pageSize });
  }

  toggleRow(row: T): void {
    const key  = row[this.config.rowKey as string];
    const next = new Set(this.selectedKeys());
    next.has(key) ? next.delete(key) : next.add(key);
    this.selectedKeys.set(next);
    this.emitSelection();
  }

  toggleAll(checked: boolean): void {
    const next = checked
      ? new Set(this.config.data.map(r => r[this.config.rowKey as string]))
      : new Set<unknown>();
    this.selectedKeys.set(next);
    this.emitSelection();
  }

  isSelected(row: T): boolean {
    return this.selectedKeys().has(row[this.config.rowKey as string]);
  }

  isAllSelected(): boolean {
    return (
      this.config.data.length > 0 &&
      this.config.data.every(r => this.selectedKeys().has(r[this.config.rowKey as string]))
    );
  }

  isIndeterminate(): boolean {
    const count = this.config.data.filter(r =>
      this.selectedKeys().has(r[this.config.rowKey as string]),
    ).length;
    return count > 0 && count < this.config.data.length;
  }

  getCellValue(row: T, key: string): string {
    const col = this.config.columns.find(c => c.key === key);
    const val = row[key];
    if (col?.formatter) return col.formatter(val, row);
    return val !== null && val !== undefined ? String(val) : '—';
  }

  getCellClass(row: T, key: string): string {
    const col = this.config.columns.find(c => c.key === key);
    if (!col?.cellClass) return '';
    return typeof col.cellClass === 'function' ? col.cellClass(row) : col.cellClass;
  }

  getCellTemplate(key: string): TemplateRef<any> | null {
    return this.cellTemplates[key] ?? null;
  }

  getCellContext(row: T, key: string): CellContext<T> {
    return { $implicit: row[key], row };
  }

  isActionVisible(action: TableAction<T>, row: T): boolean {
    return action.visible ? action.visible(row) : true;
  }

  isActionDisabled(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
  }

  getActionColor(color?: string): string {
    const map: Record<string, string> = {
      primary: 'primary',
      danger:  'danger',
      warning: 'default',
      default: 'default',
    };
    return map[color ?? 'default'] ?? 'default';
  }

  private emitSelection(): void {
    const selected = this.config.data.filter(r =>
      this.selectedKeys().has(r[this.config.rowKey as string]),
    );
    this.selectChange.emit(selected);
  }

  get totalLabel(): string {
    const total = this.config.pagination?.total ?? 0;
    return `Tổng ${total} bản ghi`;
  }
}
