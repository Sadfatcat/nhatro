import {
  ChangeDetectionStrategy, Component, EventEmitter,
  Input, OnChanges, Output, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';

@Component({
  selector:        'app-form-dialog',
  standalone:      true,
  templateUrl:     './form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, ReactiveFormsModule, NzModalModule, NzButtonModule, NzFormModule],
})
export class FormDialogComponent implements OnChanges {
  @Input() visible  = false;
  @Input() title    = '';
  @Input() form!:    FormGroup;
  @Input() width    = 600;
  @Input() loading  = false;
  @Input() okText   = 'Lưu';
  @Input() cancelText = 'Hủy';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitted     = new EventEmitter<void>();
  @Output() cancelled     = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) this.form?.markAsUntouched();
  }

  onSubmit(): void {
    if (!this.form) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitted.emit();
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.form?.reset();
    this.cancelled.emit();
  }
}
