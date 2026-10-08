import { bankInfoBlockHtml, bankInfoLineSms, bankInfoLineSmsPlain } from '../../../apps/api/src/modules/notifications/templates/invoice-table.helper';

const bank1 = { bankName: 'Techcombank', bankAccountNumber: '111', bankAccountName: 'A' };
const bank2 = { bank2Name: 'MB', bank2AccountNumber: '222', bank2AccountName: 'B' };
const bank3 = { bank3Name: 'Vietinbank', bank3AccountNumber: '86338868', bank3AccountName: 'Nguyễn Tài Thịnh' };

describe('invoice bank info helpers', () => {
  it('lists all three configured accounts in email and both SMS variants', () => {
    const data = { ...bank1, ...bank2, ...bank3 };
    expect(bankInfoBlockHtml(data)).toContain('1 trong 3 số tài khoản');
    expect(bankInfoBlockHtml(data)).toContain('Vietinbank — <strong>86338868</strong> (Nguyễn Tài Thịnh)');
    expect(bankInfoLineSms(data)).toBe(' CK: 111 (Techcombank) hoặc 222 (MB) hoặc 86338868 (Vietinbank).');
    expect(bankInfoLineSmsPlain(data)).toBe('\nCK: 111 (Techcombank) hoac 222 (MB) hoac 86338868 (Vietinbank)');
  });

  it('skips accounts without a number, and says "1 trong 2" for two accounts', () => {
    expect(bankInfoBlockHtml({ ...bank1, ...bank3 })).toContain('1 trong 2 số tài khoản');
    expect(bankInfoLineSms({ ...bank1, bank2Name: '', bank2AccountNumber: '', bank3Name: 'X' })).toBe(' CK: 111 (Techcombank).');
  });

  it('uses singular wording for a single account and renders nothing when none is configured', () => {
    expect(bankInfoBlockHtml(bank1)).toContain('Chuyển khoản tới số tài khoản sau:');
    expect(bankInfoBlockHtml({})).toBe('');
    expect(bankInfoLineSms({})).toBe('');
  });
});
