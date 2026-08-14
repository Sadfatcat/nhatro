import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { FormFieldSchema, FormSchema } from './form-schema.model';
import { CUSTOM_VALIDATORS } from './validators/custom.validators';
import { ASYNC_VALIDATORS } from './validators/async.validators';

@Component({
  selector:        'app-form-builder',
  standalone:      true,
  templateUrl:     './form-builder.component.html',
  styleUrls:       ['./form-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzCheckboxModule,
    NzRadioModule,
    NzIconModule,
    NzGridModule,
    NzUploadModule,
    NzTooltipModule,
  ],
})
export class FormBuilderComponent implements OnInit, OnChanges {
  @Input() schema!: FormSchema;
  @Input() loading = false;
  @Input() set initialValues(values: Record<string, unknown> | null) {
    if (values && this.form) this.form.patchValue(values);
    this._initialValues = values;
  }
  @Input() set beErrors(errors: Record<string, string[]>) {
    if (this.form && errors) this.applyBeErrors(errors);
  }

  private _initialValues: Record<string, unknown> | null = null;

  @Output() submitted = new EventEmitter<Record<string, unknown>>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  visibleFields = signal<string[]>([]);
  showPassword   = signal<Record<string, boolean>>({});

  private fb   = inject(FormBuilder);
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.buildForm();
    this.updateVisibleFields();
    if (this._initialValues) this.form.patchValue(this._initialValues);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['schema'] && !changes['schema'].firstChange) {
      this.buildForm();
      this.updateVisibleFields();
      if (this._initialValues) this.form.patchValue(this._initialValues);
    }
    if (changes['initialValues'] && this.form && this._initialValues) {
      this.form.patchValue(this._initialValues);
    }
  }

  private buildForm(): void {
    const controls: Record<string, unknown[]> = {};

    this.schema.fields.forEach(field => {
      const validators: ValidatorFn[] = this.buildValidators(field);
      controls[field.key] = [
        { value: field.defaultValue ?? null, disabled: field.disabled ?? false },
        validators,
      ];

      if (field.validation?.asyncValidator) {
        const asyncFactory = ASYNC_VALIDATORS[field.validation.asyncValidator];
        if (asyncFactory) {
          controls[field.key] = [
            { value: field.defaultValue ?? null, disabled: field.disabled ?? false },
            validators,
            [asyncFactory(this.http)],
          ];
        }
      }
    });

    this.form = this.fb.group(controls);

    // Wire up dependsOn visibility
    this.schema.fields
      .filter(f => f.dependsOn)
      .forEach(field => {
        const dep = field.dependsOn!;
        this.form.get(dep.field)?.valueChanges.subscribe(() => {
          this.updateVisibleFields();
        });
      });
  }

  private buildValidators(field: FormFieldSchema): ValidatorFn[] {
    const v      = field.validation;
    const result: ValidatorFn[] = [];
    if (!v) return result;

    if (v.required)              result.push(Validators.required);
    if (v.email)                 result.push(Validators.email);
    if (v.minLength !== undefined) result.push(Validators.minLength(v.minLength));
    if (v.maxLength !== undefined) result.push(Validators.maxLength(v.maxLength));
    if (v.min !== undefined)     result.push(Validators.min(v.min));
    if (v.max !== undefined)     result.push(Validators.max(v.max));
    if (v.pattern)               result.push(Validators.pattern(v.pattern));
    if (v.custom && CUSTOM_VALIDATORS[v.custom]) {
      result.push(CUSTOM_VALIDATORS[v.custom]);
    }

    return result;
  }

  private updateVisibleFields(): void {
    const visible = this.schema.fields
      .filter(f => {
        if (f.hidden) return false;
        if (!f.dependsOn) return true;
        const depVal = this.form?.get(f.dependsOn.field)?.value;
        return depVal === f.dependsOn.value;
      })
      .map(f => f.key);
    this.visibleFields.set(visible);
  }

  isVisible(key: string): boolean {
    return this.visibleFields().includes(key);
  }

  applyBeErrors(errors: Record<string, string[]>): void {
    Object.entries(errors).forEach(([key, msgs]) => {
      const ctrl = this.form.get(key);
      if (ctrl) {
        ctrl.setErrors({ beError: msgs[0] });
        ctrl.markAsTouched();
      }
    });
  }

  getError(field: FormFieldSchema): string | null {
    const ctrl   = this.form.get(field.key);
    const v      = field.validation;
    const msgs   = v?.messages ?? {};

    if (!ctrl || (!ctrl.dirty && !ctrl.touched)) return null;
    if (!ctrl.errors) return null;

    const e = ctrl.errors;
    if (e['required'])    return msgs.required    ?? 'Bắt buộc';
    if (e['email'])       return msgs.email       ?? 'Email không đúng định dạng';
    if (e['minlength'])   return msgs.minLength   ?? `Tối thiểu ${e['minlength'].requiredLength} ký tự`;
    if (e['maxlength'])   return msgs.maxLength   ?? `Tối đa ${e['maxlength'].requiredLength} ký tự`;
    if (e['min'])         return msgs.min         ?? `Giá trị tối thiểu là ${e['min'].min}`;
    if (e['max'])         return msgs.max         ?? `Giá trị tối đa là ${e['max'].max}`;
    if (e['pattern'])     return msgs.pattern     ?? 'Định dạng không hợp lệ';
    if (e['beError'])     return msgs.beError     ?? e['beError'];
    // Custom validators
    const customKey = Object.keys(e).find(k => k !== 'required');
    if (customKey) return e[customKey]?.message ?? msgs.custom ?? 'Giá trị không hợp lệ';

    return null;
  }

  getCtrl(key: string): AbstractControl {
    return this.form.get(key)!;
  }

  hasError(field: FormFieldSchema): boolean {
    return !!this.getError(field);
  }

  togglePasswordVisibility(key: string): void {
    this.showPassword.update(s => ({ ...s, [key]: !s[key] }));
  }

  isPasswordVisible(key: string): boolean {
    return this.showPassword()[key] ?? false;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitted.emit(this.form.getRawValue() as Record<string, unknown>);
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  getFieldSpan(field: FormFieldSchema): number {
    return field.span ?? 24;
  }

  onDateInputBlur(event: FocusEvent, key: string): void {
    const raw = (event.target as HTMLInputElement).value?.trim();
    if (!raw) return;
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
    if (!match) return;
    const [, d, m, y] = match.map(Number);
    const parsed = new Date(y, m - 1, d);
    if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) return;
    this.form.get(key)?.setValue(parsed);
  }
}
