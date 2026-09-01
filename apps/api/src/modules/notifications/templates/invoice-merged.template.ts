export function invoiceMergedTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Hoá đơn gộp — kỳ ${data.period} - Đây là email tự động vui lòng không trả lời`,
    html: `
      <p>Hoá đơn các phòng của bạn kỳ <strong>${data.period}</strong> đã được gộp thành một hoá đơn chung.</p>
      <pre>${data.breakdownHtml}</pre>
      <p>Tổng cộng: <strong>${data.totalAmount}</strong> đ</p>
      <p>Mọi thắc mắc vui lòng liên hệ Zalo.</p>
    `,
  };
}

export function invoiceMergedSmsTemplate(data: Record<string, string | number>): string {
  return `Hoa don gop ky ${data.period}\n${data.breakdownSms}`;
}
