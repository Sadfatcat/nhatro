import { invoiceTable } from './invoice-table.helper';

export function invoicePaidTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Xác nhận thanh toán — Phòng ${data.roomNumber} (kỳ ${data.period}) - Đây là email tự động vui lòng không trả lời`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> đã được xác nhận thanh toán.</p>
      ${invoiceTable(data)}
      <p>Cảm ơn bạn đã thanh toán đúng hạn.</p>
      <p>Mọi thắc mắc vui lòng liên hệ Zalo.</p>
    `,
  };
}
