import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ValidationErrorService {
  private _errors$ = new Subject<Record<string, string[]>>();
  errors$          = this._errors$.asObservable();

  push(errors: Record<string, string[]>): void {
    this._errors$.next(errors);
  }
}
