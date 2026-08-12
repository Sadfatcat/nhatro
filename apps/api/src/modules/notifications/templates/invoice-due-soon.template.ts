import { invoiceTable } from './invoice-table.helper';

export function invoiceDueSoonTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Nhắc hạn thanh toán — Phòng ${data.roomNumber} (kỳ ${data.period}) - Đây là email tự động vui lòng không trả lời`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> sắp đến hạn thanh toán.</p>
      ${invoiceTable(data)}
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>

      <p>Mọi thắc mắc vui lòng liên hệ Zalo.</p>
    `,
  };
}
