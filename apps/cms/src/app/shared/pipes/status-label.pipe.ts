import { Pipe, PipeTransform } from '@angular/core';

export interface StatusConfig {
  label: string;
  class: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  active:    { label: 'Hoạt động',       class: 'badge--success' },
  inactive:  { label: 'Không hoạt động', class: 'badge--gray'    },
  pending:   { label: 'Chờ duyệt',       class: 'badge--warning' },
  banned:    { label: 'Bị khóa',         class: 'badge--danger'  },
  approved:  { label: 'Đã duyệt',        class: 'badge--success' },
  rejected:  { label: 'Từ chối',         class: 'badge--danger'  },
  draft:     { label: 'Nháp',            class: 'badge--default' },
};

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): StatusConfig {
    if (!value) return { label: '—', class: 'badge--default' };
    return STATUS_MAP[value.toLowerCase()] ?? { label: value, class: 'badge--default' };
  }
}
