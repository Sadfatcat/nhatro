import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector:        'app-form-field',
  standalone:      true,
  templateUrl:     './form-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, NzFormModule],
})
export class FormFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() control?: AbstractControl | null;
  @Input() required = false;
  @Input() errorTip?: string;
  @Input() hint?: string;

  get validationStatus(): 'error' | 'validating' | '' {
    if (!this.control) return '';
    if (this.control.pending) return 'validating';
    if (this.control.invalid && (this.control.dirty || this.control.touched)) return 'error';
    return '';
  }

  get resolvedError(): string {
    return this.errorTip ?? (this.control?.errors ? 'Giá trị không hợp lệ' : '');
  }
}
