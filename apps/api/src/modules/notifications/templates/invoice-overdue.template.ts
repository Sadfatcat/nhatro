import { invoiceTable, bankInfoBlockHtml, bankInfoLineSms } from './invoice-table.helper';

export function invoiceOverdueTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Hoá đơn quá hạn — Phòng ${data.roomNumber} (kỳ ${data.period}) - Đây là email tự động vui lòng không trả lời`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> đã quá hạn thanh toán.</p>
      ${invoiceTable(data)}
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>
      <p>Vui lòng thanh toán sớm nhất có thể.</p>
      ${bankInfoBlockHtml(data)}
      <p>Mọi thắc mắc vui lòng liên hệ Zalo.</p>
    `,
  };
}

export function invoiceOverdueSmsTemplate(data: Record<string, string | number>): string {
  return `Hoá đơn phòng ${data.roomNumber} kỳ ${data.period} - ${data.totalAmount}đ đã quá hạn ${data.dueDate}. Vui lòng thanh toán sớm.${bankInfoLineSms(data)}`;
}
