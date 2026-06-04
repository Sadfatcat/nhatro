export type FilterFieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'daterange'
  | 'checkbox'
  | 'radio';

export interface FilterOption {
  label: string;
  value: unknown;
}

export interface FilterField {
  key:          string;
  label:        string;
  type:         FilterFieldType;
  placeholder?: string;
  options?:     FilterOption[];
  defaultValue?: unknown;
  span?:        number;  // nz-col span (1-24), default 6
}

export interface FilterConfig {
  fields:       FilterField[];
  collapsible?: boolean;
  autoSearch?:  boolean;
  debounceMs?:  number;
}

export type FilterValue = Record<string, unknown>;
