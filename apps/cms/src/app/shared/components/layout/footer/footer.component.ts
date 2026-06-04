import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzLayoutModule } from 'ng-zorro-antd/layout';

@Component({
  selector:        'app-footer',
  standalone:      true,
  template: `
    <nz-footer class="app-footer">
      <span>© {{ year }} Dự án làm chơi của Đạt.</span>
      <span class="version">v1.0.0</span>
    </nz-footer>
  `,
  styleUrls:       ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzLayoutModule],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
