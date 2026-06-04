import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

@Component({
  selector:        'app-shell',
  standalone:      true,
  templateUrl:     './app-shell.component.html',
  styleUrls:       ['./app-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NzLayoutModule],
})
export class AppShellComponent {
  @Input() collapsed = false;
  @Output() sidebarToggle = new EventEmitter<void>();
}
