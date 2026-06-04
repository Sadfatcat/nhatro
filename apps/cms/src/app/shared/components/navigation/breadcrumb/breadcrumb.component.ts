import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzIconModule } from 'ng-zorro-antd/icon';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?:  string;
}

@Component({
  selector:        'app-breadcrumb',
  standalone:      true,
  template: `
    <nz-breadcrumb>
      @for (item of items; track item.label) {
        <nz-breadcrumb-item>
          @if (item.route) {
            <a [routerLink]="item.route">
              @if (item.icon) { <nz-icon [nzType]="item.icon" /> }
              {{ item.label }}
            </a>
          } @else {
            @if (item.icon) { <nz-icon [nzType]="item.icon" /> }
            {{ item.label }}
          }
        </nz-breadcrumb-item>
      }
    </nz-breadcrumb>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, RouterModule, NzBreadCrumbModule, NzIconModule],
})
export class BreadcrumbComponent {
  @Input({ required: true }) items!: BreadcrumbItem[];
}
