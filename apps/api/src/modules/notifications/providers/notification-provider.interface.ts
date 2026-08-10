export type NotificationTemplateKey =
  | 'invoice-created'
  | 'invoice-due-soon'
  | 'invoice-overdue'
  | 'invoice-paid';

export interface NotificationPayload {
  to: { email?: string; phone?: string; zaloUserId?: string };
  templateKey: NotificationTemplateKey;
  data: Record<string, string | number>;
}

export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<NotificationSendResult>;
}
