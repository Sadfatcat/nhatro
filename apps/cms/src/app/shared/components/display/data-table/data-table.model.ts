export interface TableColumn<T = Record<string, unknown>> {
  key:        string;
  label:      string;
  sortable?:  boolean;
  width?:     string;
  align?:     'left' | 'center' | 'right';
  sticky?:    'start' | 'end';
  cellClass?: string | ((row: T) => string);
  formatter?: (value: unknown, row: T) => string;
  templateRef?: string;
  hide?:      boolean;
}

export interface TableAction<T = Record<string, unknown>> {
  label:     string;
  icon?:     string;
  color?:    'primary' | 'danger' | 'warning' | 'default';
  visible?:  (row: T) => boolean;
  disabled?: (row: T) => boolean;
  action:    (row: T) => void;
}

export interface PaginationConfig {
  page:       number;
  pageSize:   number;
  total:      number;
  pageSizes?: number[];
  showTotal?: boolean;
}

export interface TableConfig<T = Record<string, unknown>> {
  columns:     TableColumn<T>[];
  data:        T[];
  rowKey:      keyof T;
  loading?:    boolean;
  pagination?: PaginationConfig;
  selectable?: boolean;
  actions?:    TableAction<T>[];
  emptyText?:  string;
  scroll?:     { x?: string; y?: string };
  bordered?:   boolean;
  size?:       'small' | 'middle' | 'default';
}

export interface SortEvent {
  column:    string;
  direction: 'ascend' | 'descend' | null;
}

export interface PageChangeEvent {
  page:     number;
  pageSize: number;
}
