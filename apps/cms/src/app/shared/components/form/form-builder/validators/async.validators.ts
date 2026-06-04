import { HttpClient } from '@angular/common/http';
import { AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, take } from 'rxjs/operators';

type AsyncValidatorFactory = (http: HttpClient) => AsyncValidatorFn;

export const ASYNC_VALIDATORS: Record<string, AsyncValidatorFactory> = {
  uniqueEmail: (http: HttpClient) => (ctrl: AbstractControl): Observable<Record<string, unknown> | null> => {
    if (!ctrl.value) return of(null);
    return of(ctrl.value).pipe(
      debounceTime(400),
      switchMap(email =>
        http.get<{ exists: boolean }>(`/api/check-email?email=${email}`).pipe(
          map(res => (res.exists ? { uniqueEmail: { message: 'Email này đã được sử dụng' } } : null)),
          catchError(() => of(null)),
        ),
      ),
      take(1),
    );
  },

  uniqueUsername: (http: HttpClient) => (ctrl: AbstractControl): Observable<Record<string, unknown> | null> => {
    if (!ctrl.value) return of(null);
    return of(ctrl.value).pipe(
      debounceTime(400),
      switchMap(username =>
        http.get<{ exists: boolean }>(`/api/check-username?username=${username}`).pipe(
          map(res => (res.exists ? { uniqueUsername: { message: 'Tên đăng nhập đã tồn tại' } } : null)),
          catchError(() => of(null)),
        ),
      ),
      take(1),
    );
  },
};
