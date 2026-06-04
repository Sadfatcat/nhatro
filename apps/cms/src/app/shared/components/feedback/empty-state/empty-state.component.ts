import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector:        'app-empty-state',
  standalone:      true,
  templateUrl:     './empty-state.component.html',
  styleUrls:       ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzEmptyModule, NzButtonModule, NzIconModule],
})
export class EmptyStateComponent {
  @Input() title       = 'Không có dữ liệu';
  @Input() description = '';
  @Input() actionLabel?: string;
  @Input() actionIcon?: string;
  @Input() compact     = false;
}
