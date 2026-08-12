import { describe, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PermissionDirective } from '../../../apps/cms/src/app/core/permission/directives/permission.directive';
import { PermissionService } from '../../../apps/cms/src/app/core/permission/services/permission.service';
import { AuthService } from '../../../apps/cms/src/app/core/auth/services/auth.service';

@Component({
  standalone: true,
  imports:    [PermissionDirective],
  template:   `<div *appPermission="'contracts:delete'" class="secret">Xoá hợp đồng</div>`,
})
class HostComponent {}

function render(role: string | null) {
  TestBed.configureTestingModule({
    imports:   [HostComponent],
    providers: [
      PermissionService,
      { provide: AuthService, useValue: { role: signal(role) } },
    ],
  });
  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();
  return fixture;
}

describe('PermissionDirective (*appPermission)', () => {
  it('hides the element for a role lacking the permission (TENANT, contracts:delete)', () => {
    const fixture = render('TENANT');
    expect(fixture.nativeElement.querySelector('.secret')).toBeNull();
  });

  it('renders the element for a role holding the permission (ADMIN, contracts:delete)', () => {
    const fixture = render('ADMIN');
    expect(fixture.nativeElement.querySelector('.secret')?.textContent).toContain('Xoá hợp đồng');
  });

  it('renders for LANDLORD too — regression guard for the contracts:delete grant', () => {
    const fixture = render('LANDLORD');
    expect(fixture.nativeElement.querySelector('.secret')).not.toBeNull();
  });
});
