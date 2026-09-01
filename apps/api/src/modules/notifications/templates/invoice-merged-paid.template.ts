export function invoiceMergedPaidTemplate(data: Record<string, string | number>): { subject: string; html: string } {
  return {
    subject: `Xác nhận thanh toán hoá đơn gộp — kỳ ${data.period} - Đây là email tự động vui lòng không trả lời`,
    html: `
      <p>Hoá đơn gộp kỳ <strong>${data.period}</strong> của bạn với tổng số tiền <strong>${data.totalAmount}</strong> đ đã được xác nhận thanh toán.</p>
      <pre>${data.breakdownHtml}</pre>
      <p>Cảm ơn bạn đã thanh toán đúng hạn.</p>
      <p>Mọi thắc mắc vui lòng liên hệ Zalo.</p>
    `,
  };
}

export function invoiceMergedPaidSmsTemplate(data: Record<string, string | number>): string {
  return `Da xac nhan thanh toan hoa don gop ky ${data.period}\n${data.breakdownSms}\nCam on ban!`;
}
