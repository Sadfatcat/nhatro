import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector:        'app-loading-state',
  standalone:      true,
  templateUrl:     './loading-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzSkeletonModule, NzSpinModule],
})
export class LoadingStateComponent {
  @Input() type: 'skeleton' | 'spinner' = 'skeleton';
  @Input() rows   = 4;
  @Input() active = true;
}
