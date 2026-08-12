import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector:        'app-offline-banner',
  standalone:      true,
  templateUrl:     './offline-banner.component.html',
  styleUrls:       ['./offline-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzIconModule],
})
export class OfflineBannerComponent {
  isOffline = signal(!navigator.onLine);

  constructor() {
    window.addEventListener('online',  () => this.isOffline.set(false));
    window.addEventListener('offline', () => this.isOffline.set(true));
  }
}
