export function invoicePaidTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Xác nhận thanh toán — Phòng ${data.roomNumber} (kỳ ${data.period})`,
    html: `
      <p>Hoá đơn phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong> đã được xác nhận thanh toán.</p>
      <table cellpadding="4" cellspacing="0" style="border-collapse:collapse">
        <tr><td>Tiền phòng</td><td><strong>${data.rentAmount} đ</strong></td></tr>
        <tr><td>Điện: ${data.prevElec} → ${data.currElec} kWh (dùng ${data.elecUsed} kWh × ${data.elecUnitPrice} đ)</td><td><strong>${data.electricityAmount} đ</strong></td></tr>
        <tr><td>Nước: ${data.prevWater} → ${data.currWater} m³ (dùng ${data.waterUsed} m³ × ${data.waterUnitPrice} đ)</td><td><strong>${data.waterAmount} đ</strong></td></tr>
        <tr><td>Phí rác</td><td><strong>${data.otherFees} đ</strong></td></tr>
      </table>
      <p>Tổng tiền: <strong>${data.totalAmount} đ</strong></p>
      <p>Cảm ơn bạn đã thanh toán đúng hạn.</p>
    `,
  };
}
