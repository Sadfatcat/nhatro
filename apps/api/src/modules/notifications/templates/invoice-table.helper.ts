// [bank name key, account number key, account holder key] per configured landlord bank account
const BANK_ACCOUNT_KEYS = [
  ['bankName',  'bankAccountNumber',  'bankAccountName'],
  ['bank2Name', 'bank2AccountNumber', 'bank2AccountName'],
  ['bank3Name', 'bank3AccountNumber', 'bank3AccountName'],
] as const;

function configuredBankAccounts(data: Record<string, string | number>) {
  return BANK_ACCOUNT_KEYS
    .filter(([, numberKey]) => data[numberKey])
    .map(([nameKey, numberKey, holderKey]) => ({ name: data[nameKey], number: data[numberKey], holder: data[holderKey] }));
}

export function bankInfoBlockHtml(data: Record<string, string | number>): string {
  const accounts = configuredBankAccounts(data).map(a => `${a.name} — <strong>${a.number}</strong> (${a.holder})`);
  if (accounts.length === 0) return '';
  const heading = accounts.length === 1 ? 'Chuyển khoản tới số tài khoản sau:' : `Chuyển khoản tới 1 trong ${accounts.length} số tài khoản sau:`;
  return `<p>${heading}<br>${accounts.join('<br>')}</p>`;
}

export function bankInfoLineSms(data: Record<string, string | number>): string {
  const accounts = configuredBankAccounts(data).map(a => `${a.number} (${a.name})`);
  return accounts.length ? ` CK: ${accounts.join(' hoặc ')}.` : '';
}

export function bankInfoLineSmsPlain(data: Record<string, string | number>): string {
  const accounts = configuredBankAccounts(data).map(a => `${a.number} (${a.name})`);
  return accounts.length ? `\nCK: ${accounts.join(' hoac ')}` : '';
}

export function invoiceBreakdownSmsPlain(data: Record<string, string | number>): string {
  const lines = [
    `Phong: ${data.rentAmount}d`,
    `Dien ${data.prevElec}->${data.currElec}kWh(${data.elecUsed}kWh x ${data.elecUnitPrice}d): ${data.electricityAmount}d`,
    `Nuoc ${data.prevWater}->${data.currWater}m3(${data.waterUsed}m3 x ${data.waterUnitPrice}d): ${data.waterAmount}d`,
    `Rac: ${data.garbageFee}d`,
  ];
  if (data.otherFees !== '0') lines.push(`Phi khac: ${data.otherFees}d`);
  if (data.deduction !== '0') lines.push(`Khau tru: -${data.deduction}d`);
  lines.push(`Tong: ${data.totalAmount}d`);
  return lines.join('\n');
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
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.garbageFee} đ</td>
      </tr>
      ${data.otherFees !== '0' ? `
      <tr>
        <td style="padding:8px;border:1px solid #d1d5db">Phí khác</td>
        <td style="padding:8px;border:1px solid #d1d5db">—</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.otherFees} đ</td>
      </tr>` : ''}
      ${data.deduction !== '0' ? `
      <tr>
        <td style="padding:8px;border:1px solid #d1d5db">Khấu trừ</td>
        <td style="padding:8px;border:1px solid #d1d5db">—</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">−${data.deduction} đ</td>
      </tr>` : ''}
      <tr style="background:#f3f4f6;font-weight:bold">
        <td style="padding:8px;border:1px solid #d1d5db" colspan="2">Tổng cộng</td>
        <td style="text-align:right;padding:8px;border:1px solid #d1d5db">${data.totalAmount} đ</td>
      </tr>
    </table>
  `;
}
