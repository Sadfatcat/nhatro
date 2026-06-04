import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCardModule } from 'ng-zorro-antd/card';

export interface InfoCardConfig {
  title:     string;
  value:     string | number;
  icon?:     string;
  color?:    string;
  trend?:    number;
  unit?:     string;
}

@Component({
  selector:        'app-info-card',
  standalone:      true,
  templateUrl:     './info-card.component.html',
  styleUrls:       ['./info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzIconModule, NzCardModule],
})
export class InfoCardComponent {
  @Input({ required: true }) config!: InfoCardConfig;
}
