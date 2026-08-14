export function bankInfoBlockHtml(data: Record<string, string | number>): string {
  const accounts = [
    data.bankAccountNumber ? `${data.bankName} — <strong>${data.bankAccountNumber}</strong> (${data.bankAccountName})` : null,
    data.bank2AccountNumber ? `${data.bank2Name} — <strong>${data.bank2AccountNumber}</strong> (${data.bank2AccountName})` : null,
  ].filter(Boolean);
  if (accounts.length === 0) return '';
  return `<p>Chuyển khoản tới 1 trong 2 số tài khoản sau:<br>${accounts.join('<br>')}</p>`;
}

export function bankInfoLineSms(data: Record<string, string | number>): string {
  const accounts = [
    data.bankAccountNumber ? `${data.bankAccountNumber} (${data.bankName})` : null,
    data.bank2AccountNumber ? `${data.bank2AccountNumber} (${data.bank2Name})` : null,
  ].filter(Boolean);
  return accounts.length ? ` CK: ${accounts.join(' hoặc ')}.` : '';
}

export function invoiceTable(data: Record<string, string | number>): string {
  return `
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:480px;font-family:sans-serif;font-size:14px">
      <tr style="background:#f3f4f6">
        <th style="text-align:left;padding:8px;border:1px solid #d1d5db">Khoản mục</th>
        <th style="text-align:left;padding:8px;border:1px solid #d1d5db">Chi tiết</th>
        <th style="text-align:right;padding:8px;border:1px solid #d1d5db">Số tiền</th>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #d1d5db">Tiền phòng</td>
        <td style="padding:8px;border:1px solid #d1d5db">—</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.rentAmount} đ</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #d1d5db">Tiền điện</td>
        <td style="padding:8px;border:1px solid #d1d5db">${data.prevElec} → ${data.currElec} kWh (dùng ${data.elecUsed} kWh × ${data.elecUnitPrice} đ)</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.electricityAmount} đ</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #d1d5db">Tiền nước</td>
        <td style="padding:8px;border:1px solid #d1d5db">${data.prevWater} → ${data.currWater} m³ (dùng ${data.waterUsed} m³ × ${data.waterUnitPrice} đ)</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.waterAmount} đ</td>
      </tr>
      <tr>
        <td style="padding:8px;border:1px solid #d1d5db">Phí rác</td>
        <td style="padding:8px;border:1px solid #d1d5db">—</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.otherFees} đ</td>
      </tr>
      <tr style="background:#f3f4f6;font-weight:bold">
        <td style="padding:8px;border:1px solid #d1d5db" colspan="2">Tổng cộng</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.totalAmount} đ</td>
      </tr>
    </table>
  `;
}
