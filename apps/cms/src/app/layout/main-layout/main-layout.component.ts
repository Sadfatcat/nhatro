import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { TopbarComponent } from '../../shared/components/layout/topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../../shared/components/layout/footer/footer.component';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector:        'app-main-layout',
  standalone:      true,
  templateUrl:     './main-layout.component.html',
  styleUrls:       ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NzLayoutModule,
    TopbarComponent,
    SidebarComponent,
    FooterComponent,
  ],
})
export class MainLayoutComponent {
  private storage = inject(StorageService);

  collapsed = signal<boolean>(this.storage.get<boolean>('sidebar_collapsed') ?? false);

  toggleSidebar(): void {
    this.collapsed.update(v => !v);
    this.storage.set('sidebar_collapsed', this.collapsed());
  }
}
