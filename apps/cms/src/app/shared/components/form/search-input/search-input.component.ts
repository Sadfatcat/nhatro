import {
  ChangeDetectionStrategy, Component, EventEmitter,
  Input, OnDestroy, OnInit, Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector:        'app-search-input',
  standalone:      true,
  templateUrl:     './search-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [CommonModule, FormsModule, NzInputModule, NzIconModule, NzButtonModule],
})
export class SearchInputComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Tìm kiếm...';
  @Input() debounceMs  = 400;
  @Input() value       = '';

  @Output() search = new EventEmitter<string>();

  inputValue = '';
  private input$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.inputValue = this.value;
    this.input$
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => this.search.emit(v));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(v: string): void { this.input$.next(v); }

  onClear(): void {
    this.inputValue = '';
    this.search.emit('');
  }
}
