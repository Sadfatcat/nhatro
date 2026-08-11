import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

import { InvoiceCreationLogComponent } from '../invoice-creation-log/invoice-creation-log.component';
import { InvoicesByBillingDayComponent } from '../invoices-by-billing-day/invoices-by-billing-day.component';

@Component({
  selector:        'app-invoices-list',
  standalone:      true,
  templateUrl:     './invoices-list.component.html',
  styleUrls:       ['./invoices-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NzTabsModule,
    InvoiceCreationLogComponent, InvoicesByBillingDayComponent,
  ],
})
export class InvoicesListComponent {}
