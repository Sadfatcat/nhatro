import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '../services/auth.service';

@Component({
  selector:        'app-login',
  standalone:      true,
  templateUrl:     './login.component.html',
  styleUrls:       ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, NzInputModule, NzButtonModule],
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private msg    = inject(NzMessageService);

  loading    = signal(false);
  identifier = signal('');
  password   = signal('');

  onSubmit(): void {
    this.loading.set(true);
    this.auth
      .login({ identifier: this.identifier(), password: this.password() })
      .subscribe({
        next: () => {
          this.msg.success('Đăng nhập thành công!');
          this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || this.auth.defaultRoute());
        },
        error: () => this.loading.set(false),
      });
  }

  onCancel(): void {
    this.identifier.set('');
    this.password.set('');
  }
}
