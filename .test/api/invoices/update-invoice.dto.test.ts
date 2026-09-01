import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateInvoiceDto } from '../../../apps/api/src/modules/invoices/dto/update-invoice.dto';

describe('UpdateInvoiceDto — validation', () => {
  it('rejects a negative deduction', async () => {
    const dto = plainToInstance(UpdateInvoiceDto, { deduction: -1000 });
    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'deduction')).toBe(true);
  });

  it('rejects a negative garbageFee', async () => {
    const dto = plainToInstance(UpdateInvoiceDto, { garbageFee: -1 });
    const errors = await validate(dto);
    expect(errors.some(e => e.property === 'garbageFee')).toBe(true);
  });

  it('accepts deduction: 0 and a positive deduction', async () => {
    const zero = plainToInstance(UpdateInvoiceDto, { deduction: 0 });
    const positive = plainToInstance(UpdateInvoiceDto, { deduction: 100000 });
    expect(await validate(zero)).toHaveLength(0);
    expect(await validate(positive)).toHaveLength(0);
  });
});
