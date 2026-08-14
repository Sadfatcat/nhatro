export type NotificationTemplateKey =
  | 'invoice-created'
  | 'invoice-due-soon'
  | 'invoice-overdue'
  | 'invoice-paid';

export interface NotificationPayload {
  to: { email?: string; phone?: string };
  templateKey: NotificationTemplateKey;
  data: Record<string, string | number>;
  invoiceId?: string;
}

export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationSendResult>;
}
