import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { UserRole } from '@nhatro/shared-types';

const ROLE_MAP: Record<UserRole, { label: string; color: string }> = {
  [UserRole.ADMIN]:    { label: 'Quản trị viên', color: 'purple' },
  [UserRole.LANDLORD]: { label: 'Chủ trọ',       color: 'blue' },
  [UserRole.TENANT]:   { label: 'Người thuê',     color: 'cyan' },
};

@Component({
  selector:        'app-role-badge',
  standalone:      true,
  template:        `<nz-tag [nzColor]="config.color">{{ config.label }}</nz-tag>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [NzTagModule],
})
export class RoleBadgeComponent {
  @Input({ required: true }) role!: UserRole;

  get config(): { label: string; color: string } {
    return ROLE_MAP[this.role] ?? { label: this.role, color: 'default' };
  }
}
