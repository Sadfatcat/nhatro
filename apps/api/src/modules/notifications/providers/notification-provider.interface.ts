export type NotificationTemplateKey =
  | 'invoice-created'
  | 'invoice-due-soon'
  | 'invoice-overdue'
  | 'invoice-paid'
  | 'invoice-merged'
  | 'invoice-merged-paid';

export interface NotificationPayload {
  to: { email?: string; phone?: string };
  templateKey: NotificationTemplateKey;
  data: Record<string, string | number>;
  invoiceId?: string;
  /** For a merged-invoice send: log the attempt against each child invoice (no MergedInvoice FK exists on NotificationLog). */
  invoiceIds?: string[];
}

export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationSendResult>;
}
