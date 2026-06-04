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

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();

    if (this.config.autoSearch) {
      this.form.valueChanges
        .pipe(
          debounceTime(this.config.debounceMs ?? 400),
          distinctUntilChanged(),
        )
        .subscribe(values => this.filterChange.emit(this.cleanValue(values)));
    }
  }

  private buildForm(): void {
    const controls: Record<string, unknown> = {};
    this.config.fields.forEach(f => {
      controls[f.key] = [f.defaultValue ?? null];
    });
    this.form = this.fb.group(controls);
  }

  onSearch(): void {
    this.filterChange.emit(this.cleanValue(this.form.value));
  }

  onReset(): void {
    this.form.reset();
    this.config.fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        this.form.get(f.key)?.setValue(f.defaultValue);
      }
    });
    this.filterReset.emit();
    this.filterChange.emit({});
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
