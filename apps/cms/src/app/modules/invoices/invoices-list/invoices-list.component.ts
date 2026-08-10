import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { UtilityReadingLogComponent } from '../utility-reading-log/utility-reading-log.component';
import { InvoicesByBillingDayComponent } from '../invoices-by-billing-day/invoices-by-billing-day.component';

@Component({
  selector:        'app-invoices-list',
  standalone:      true,
  templateUrl:     './invoices-list.component.html',
  styleUrls:       ['./invoices-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NzTabsModule,
    UtilityReadingLogComponent, InvoicesByBillingDayComponent,
  ],
})
export class InvoicesListComponent {}
