import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { MenuItem } from '../../../../layout/sidebar/side-items';

@Component({
  selector:        'app-more-sheet',
  standalone:      true,
  templateUrl:     './more-sheet.component.html',
  styleUrls:       ['./more-sheet.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzDrawerModule, NzIconModule],
})
export class MoreSheetComponent {
  @Input()  items: MenuItem[] = [];
  @Input()  visible = false;
  @Input()  isActive: (route?: string) => boolean = () => false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() navigate      = new EventEmitter<string>();

  close(): void {
    this.visibleChange.emit(false);
  }

  onNavigate(route?: string): void {
    if (!route) return;
    this.navigate.emit(route);
    this.close();
  }
}
