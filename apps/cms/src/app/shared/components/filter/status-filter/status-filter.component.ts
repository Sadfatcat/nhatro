import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { AnyStatus, SelectFilterOption } from '../filter.types';

@Component({
  selector:        'app-status-filter',
  standalone:      true,
  templateUrl:     './status-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzSelectModule],
})
export class StatusFilterComponent {
  @Input({ required: true }) statusOptions!: SelectFilterOption[];
  @Input() label       = 'Trạng thái';
  @Input() placeholder = 'Tất cả';
  @Input() value: AnyStatus | null = null;

  @Output() valueChange = new EventEmitter<AnyStatus | null>();
}
