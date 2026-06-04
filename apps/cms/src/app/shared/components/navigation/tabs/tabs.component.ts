import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

export interface TabItem {
  key:    string;
  label:  string;
  icon?:  string;
  badge?: number;
}

@Component({
  selector:        'app-tabs',
  standalone:      true,
  template: `
    <nz-tabs
      [nzSelectedIndex]="selectedIndex"
      [nzType]="type"
      [nzSize]="size"
      (nzSelectedIndexChange)="onTabChange($any($event))">
      @for (tab of tabs; track tab.key) {
        <nz-tab [nzTitle]="tab.label">
          <ng-content />
        </nz-tab>
      }
    </nz-tabs>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzTabsModule],
})
export class TabsComponent {
  @Input({ required: true }) tabs!: TabItem[];
  @Input() selectedIndex = 0;
  @Input() type: 'line' | 'card' | 'editable-card' = 'line';
  @Input() size: 'large' | 'default' | 'small' = 'default';

  @Output() tabChange = new EventEmitter<{ index: number; tab: TabItem }>();

  onTabChange(index: number): void {
    this.tabChange.emit({ index, tab: this.tabs[index] });
  }
}
