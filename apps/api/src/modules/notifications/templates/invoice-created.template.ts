export function invoiceCreatedTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Hoá đơn mới — Phòng ${data.roomNumber} (kỳ ${data.period})`,
    html: `
      <p>Bạn có hoá đơn mới cho phòng <strong>${data.roomNumber}</strong>, kỳ <strong>${data.period}</strong>.</p>
      <table cellpadding="4" cellspacing="0" style="border-collapse:collapse">
        <tr><td>Tiền phòng</td><td><strong>${data.rentAmount} đ</strong></td></tr>
        <tr><td>Điện: ${data.prevElec} → ${data.currElec} kWh (dùng ${data.elecUsed} kWh × ${data.elecUnitPrice} đ)</td><td><strong>${data.electricityAmount} đ</strong></td></tr>
        <tr><td>Nước: ${data.prevWater} → ${data.currWater} m³ (dùng ${data.waterUsed} m³ × ${data.waterUnitPrice} đ)</td><td><strong>${data.waterAmount} đ</strong></td></tr>
        <tr><td>Phí rác</td><td><strong>${data.otherFees} đ</strong></td></tr>
      </table>
      <p>Tổng tiền: <strong>${data.totalAmount} đ</strong></p>
      <p>Hạn thanh toán: <strong>${data.dueDate}</strong></p>
      <p>Mã tham chiếu: ${data.referenceCode}</p>
    `,
  };
}
