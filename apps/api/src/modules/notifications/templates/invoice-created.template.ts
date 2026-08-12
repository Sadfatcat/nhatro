import { invoiceTable } from './invoice-table.helper';

export function invoiceCreatedTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Hoá đơn tiền nhà — Phòng ${data.roomNumber} (kỳ ${data.period}) - Đây là email tự động vui lòng không trả lời`,
    html: `
      <p>Bạn có hoá đơn mới cho phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong>.</p>
      ${invoiceTable(data)}
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>
      <p>Mã tham chiếu: ${data.referenceCode}</p>

      <p>Mọi thắc mắc vui lòng liên hệ Zalo.</p>
    `,
  };
}
