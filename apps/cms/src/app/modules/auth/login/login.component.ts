import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { MOCK_USERS } from '@nhatro/shared-mocks';
import { MockUser } from '@nhatro/shared-types';
import { AuthService } from '../../../core/auth/services/auth.service';
import { FormBuilderComponent } from '../../../shared/components/form/form-builder/form-builder.component';
import { FormSchema } from '../../../shared/components/form/form-builder/form-schema.model';

@Component({
  selector:        'app-login',
  standalone:      true,
  templateUrl:     './login.component.html',
  styleUrls:       ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormBuilderComponent],
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private msg    = inject(NzMessageService);

  loading    = signal(false);
  mockUsers  = MOCK_USERS;

  schema: FormSchema = {
    submitLabel: 'Đăng nhập',
    cancelLabel: undefined,
    fields: [
      {
        key:         'identifier',
        type:        'text',
        label:       'Tên đăng nhập / Email',
        placeholder: 'username hoặc email',
        validation: {
          required: true,
          messages: { required: 'Vui lòng nhập tên đăng nhập' },
        },
      },
      {
        key:         'password',
        type:        'password',
        label:       'Mật khẩu',
        placeholder: '••••••••',
        validation: {
          required:  true,
          minLength: 6,
          messages:  { required: 'Vui lòng nhập mật khẩu', minLength: 'Mật khẩu tối thiểu 6 ký tự' },
        },
      },
    ],
  };

  quickLogin(user: MockUser): void {
    this.onSubmit({ identifier: user.email, password: user.password ?? '' });
  }

  onSubmit(value: Record<string, unknown>): void {
    this.loading.set(true);
    this.auth
      .login({ identifier: value['identifier'] as string, password: value['password'] as string })
      .subscribe({
        next: () => {
          this.msg.success('Đăng nhập thành công!');
          this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || this.auth.defaultRoute());
        },
        error: (err: Error) => {
          this.msg.error(err?.message ?? 'Đăng nhập thất bại');
          this.loading.set(false);
        },
      });
  }
}
