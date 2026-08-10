export function invoiceDueSoonTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Nhắc hạn thanh toán — Phòng ${data.roomNumber} (kỳ ${data.period})`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> sắp đến hạn thanh toán.</p>
      <p>Tổng tiền: <strong>${data.totalAmount} đ</strong></p>
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>
    `,
  };
}
