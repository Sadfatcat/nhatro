export function invoicePaidTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Xác nhận thanh toán — Phòng ${data.roomNumber} (kỳ ${data.period})`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> đã được xác nhận thanh toán.</p>
      <p>Tổng tiền: <strong>${data.totalAmount} đ</strong></p>
      <p>Cảm ơn bạn đã thanh toán đúng hạn.</p>
    `,
  };
}
