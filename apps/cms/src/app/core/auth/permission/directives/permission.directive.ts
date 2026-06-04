import { Directive, inject, Input, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  selector:   '[appPermission]',
  standalone: true,
})
export class PermissionDirective implements OnInit {
  @Input('appPermission') permission!: string | string[];

  private permissions = inject(PermissionService);
  private view        = inject(ViewContainerRef);
  private tmpl        = inject(TemplateRef<unknown>);

  ngOnInit(): void {
    const perms = Array.isArray(this.permission) ? this.permission : [this.permission];
    const show  = perms.every(p => this.permissions.hasPermission(p));
    show ? this.view.createEmbeddedView(this.tmpl) : this.view.clear();
  }
}
