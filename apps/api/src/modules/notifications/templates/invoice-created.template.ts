export function invoiceCreatedTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Hoá đơn mới — Phòng ${data.roomNumber} (kỳ ${data.period})`,
    html: `
      <p>Bạn có hoá đơn mới cho phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong>.</p>
      <p>Tổng tiền: <strong>${data.totalAmount} đ</strong></p>
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>
      <p>Mã tham chiếu: ${data.referenceCode}</p>
    `,
  };
}
