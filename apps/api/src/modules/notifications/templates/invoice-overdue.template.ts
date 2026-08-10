export function invoiceOverdueTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Hoá đơn quá hạn — Phòng ${data.roomNumber} (kỳ ${data.period})`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> đã quá hạn thanh toán.</p>
      <p>Tổng tiền: <strong>${data.totalAmount} đ</strong></p>
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>
      <p>Vui lòng thanh toán sớm nhất có thể.</p>
    `,
  };
}
