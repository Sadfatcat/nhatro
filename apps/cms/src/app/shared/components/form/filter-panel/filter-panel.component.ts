import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { StorageService } from '../../../../core/services/storage.service';
import { FilterConfig, FilterValue } from './filter-panel.model';

@Component({
  selector:        'app-filter-panel',
  standalone:      true,
  templateUrl:     './filter-panel.component.html',
  styleUrls:       ['./filter-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzCheckboxModule,
    NzRadioModule,
  ],
})
export class FilterPanelComponent implements OnInit {
  @Input() config!: FilterConfig;

  @Output() filterChange = new EventEmitter<FilterValue>();
  @Output() filterReset  = new EventEmitter<void>();

  form!: FormGroup;
  collapsed = signal(false);

  constructor(private fb: FormBuilder, private storage: StorageService) {}

  ngOnInit(): void {
    this.buildForm();
    this.restoreSavedValue();

    if (this.config.autoSearch) {
      this.form.valueChanges
        .pipe(
          debounceTime(this.config.debounceMs ?? 400),
          distinctUntilChanged(),
        )
        .subscribe(values => this.emitFilter(values));
    }

    // Parent relies on this single initial emit to load data with the restored filters.
    if (this.config.storageKey) queueMicrotask(() => this.filterChange.emit(this.cleanValue(this.form.value)));
  }

  private storageKeyOrNull(): string | null {
    return this.config.storageKey ? `nhatro:filter:${this.config.storageKey}` : null;
  }

  private restoreSavedValue(): void {
    const key = this.storageKeyOrNull();
    const saved = key && this.storage.get<FilterValue>(key);
    if (!saved) return;
    const restorableKeys = this.config.fields
      .filter(f => f.type !== 'date' && f.type !== 'daterange')
      .map(f => f.key);
    const restorable = Object.fromEntries(Object.entries(saved).filter(([k]) => restorableKeys.includes(k)));
    this.form.patchValue(restorable, { emitEvent: false });
  }

  private emitFilter(rawValue: FilterValue): void {
    const value = this.cleanValue(rawValue);
    const key = this.storageKeyOrNull();
    if (key) this.storage.set(key, value);
    this.filterChange.emit(value);
  }

  private buildForm(): void {
    const controls: Record<string, unknown> = {};
    this.config.fields.forEach(f => {
      controls[f.key] = [f.defaultValue ?? null];
    });
    this.form = this.fb.group(controls);
  }

  onSearch(): void {
    this.emitFilter(this.form.value);
  }

  onReset(): void {
    this.form.reset();
    this.config.fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        this.form.get(f.key)?.setValue(f.defaultValue);
      }
    });
    this.filterReset.emit();
    this.emitFilter({});
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
  }

  private cleanValue(value: FilterValue): FilterValue {
    const result: FilterValue = {};
    Object.entries(value).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') result[k] = v;
    });
    return result;
  }
}
