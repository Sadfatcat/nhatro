import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../handlers/error.handler';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);
  return next(req).pipe(
    catchError(err => {
      errorHandler.handle(err);
      return throwError(() => err);
    }),
  );
};
