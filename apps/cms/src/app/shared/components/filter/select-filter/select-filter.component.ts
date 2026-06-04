import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { SelectFilterOption } from '../filter.types';

@Component({
  selector:        'app-select-filter',
  standalone:      true,
  templateUrl:     './select-filter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzSelectModule, NzFormModule],
})
export class SelectFilterComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) options!: SelectFilterOption[];
  @Input() placeholder = 'Tất cả';
  @Input() multiple    = false;
  @Input() value: unknown = null;

  @Output() valueChange = new EventEmitter<unknown>();
}
