import { invoiceTable, bankInfoBlockHtml, bankInfoLineSms } from './invoice-table.helper';

export function invoiceDueSoonTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Nhắc hạn thanh toán — Phòng ${data.roomNumber} (kỳ ${data.period}) - Đây là email tự động vui lòng không trả lời`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> sắp đến hạn thanh toán.</p>
      ${invoiceTable(data)}
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>
      ${bankInfoBlockHtml(data)}
      <p>Mọi thắc mắc vui lòng liên hệ Zalo.</p>
    `,
  };
}

export function invoiceDueSoonSmsTemplate(data: Record<string, string | number>): string {
  return `Nhắc hạn: hoá đơn phòng ${data.roomNumber} kỳ ${data.period} - ${data.totalAmount}đ sắp đến hạn ${data.dueDate}.${bankInfoLineSms(data)}`;
}
