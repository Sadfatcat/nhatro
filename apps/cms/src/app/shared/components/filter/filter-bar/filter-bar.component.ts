import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';

@Component({
  selector:        'app-filter-bar',
  standalone:      true,
  templateUrl:     './filter-bar.component.html',
  styleUrls:       ['./filter-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzButtonModule, NzIconModule, NzGridModule],
})
export class FilterBarComponent {
  @Input() loading = false;
  @Input() showReset = true;

  @Output() apply = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
}
