import {
  ChangeDetectionStrategy, Component, EventEmitter,
  inject, Input, OnChanges, Output, signal, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { FormDialogComponent } from '../../../../shared/components/overlay/form-dialog/form-dialog.component';
import { MoneyDisplayComponent } from '../../../../shared/components/display/money-display/money-display.component';
import { Room } from '@nhatro/shared-types';

export interface RoomChargeResult {
  roomId:              string;
  oldElectricity:      number;
  newElectricity:      number;
  oldWater:            number;
  newWater:            number;
  electricityUnitPrice: number;
  waterUnitPrice:      number;
  extraFee:            number;
  extraFeeNote:        string;
  electricityUsage:    number;
  waterUsage:          number;
  electricityAmount:   number;
  waterAmount:         number;
  totalAmount:         number;
}

@Component({
  selector:        'app-monthly-room-charge-dialog',
  standalone:      true,
  templateUrl:     './monthly-room-charge-dialog.component.html',
  styleUrls:       ['./monthly-room-charge-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzGridModule,
    NzDividerModule,
    FormDialogComponent,
    MoneyDisplayComponent,
  ],
})
export class MonthlyRoomChargeDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() room!: Room;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<RoomChargeResult>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    oldElectricity:       [0, [Validators.required, Validators.min(0)]],
    newElectricity:       [0, [Validators.required, Validators.min(0)]],
    oldWater:             [0, [Validators.required, Validators.min(0)]],
    newWater:             [0, [Validators.required, Validators.min(0)]],
    electricityUnitPrice: [4000, [Validators.required, Validators.min(1)]],
    waterUnitPrice:       [15000, [Validators.required, Validators.min(1)]],
    extraFee:             [0],
    extraFeeNote:         [''],
  });

  preview = signal<Omit<RoomChargeResult, 'roomId'> | null>(null);

  ngOnChanges(c: SimpleChanges): void {
    if (c['visible']?.currentValue === true) {
      this.form.reset({ electricityUnitPrice: 4000, waterUnitPrice: 15000, extraFee: 0 });
      this.preview.set(null);
    }
  }

  recalculate(): void {
    const v = this.form.getRawValue();
    const eUsage = Math.max(0, (v.newElectricity ?? 0) - (v.oldElectricity ?? 0));
    const wUsage = Math.max(0, (v.newWater ?? 0) - (v.oldWater ?? 0));
    const eAmt   = eUsage * (v.electricityUnitPrice ?? 0);
    const wAmt   = wUsage * (v.waterUnitPrice ?? 0);
    const extra  = v.extraFee ?? 0;
    this.preview.set({
      oldElectricity:       v.oldElectricity ?? 0,
      newElectricity:       v.newElectricity ?? 0,
      oldWater:             v.oldWater ?? 0,
      newWater:             v.newWater ?? 0,
      electricityUnitPrice: v.electricityUnitPrice ?? 0,
      waterUnitPrice:       v.waterUnitPrice ?? 0,
      extraFee:             extra,
      extraFeeNote:         v.extraFeeNote ?? '',
      electricityUsage:     eUsage,
      waterUsage:           wUsage,
      electricityAmount:    eAmt,
      waterAmount:          wAmt,
      totalAmount:          this.room.price + eAmt + wAmt + extra,
    });
  }

  validate(): boolean {
    const v = this.form.getRawValue();
    if ((v.newElectricity ?? 0) < (v.oldElectricity ?? 0)) {
      this.form.get('newElectricity')?.setErrors({ lessThanOld: true });
      return false;
    }
    if ((v.newWater ?? 0) < (v.oldWater ?? 0)) {
      this.form.get('newWater')?.setErrors({ lessThanOld: true });
      return false;
    }
    return true;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.validate()) return;
    this.recalculate();
    const p = this.preview();
    if (!p) return;
    this.saved.emit({ roomId: this.room.id, ...p });
    this.visibleChange.emit(false);
  }

  onCancel(): void {
    this.visibleChange.emit(false);
  }
}
