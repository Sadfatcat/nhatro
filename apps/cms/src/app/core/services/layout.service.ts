import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';

const MOBILE_QUERY = '(max-width: 767.98px)';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private bp = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.bp.observe(MOBILE_QUERY).pipe(map(r => r.matches)),
    { initialValue: window.matchMedia(MOBILE_QUERY).matches },
  );
}
