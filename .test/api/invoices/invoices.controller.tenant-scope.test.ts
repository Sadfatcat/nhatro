import { InvoicesController } from '../../../apps/api/src/modules/invoices/invoices.controller';

// Regression: accounts stay attached to the ROOM across tenant turnover (password reset,
// not a new account) — GET /invoices used to filter by roomId only, so an incoming tenant
// could see the previous occupant's full invoice history for the same room.
describe('InvoicesController.findAll — tenant scoped to their own contract, not just the room', () => {
  let svc: { findAll: jest.Mock };
  let contracts: { findByRoom: jest.Mock };
  let controller: InvoicesController;

  beforeEach(() => {
    svc = { findAll: jest.fn().mockResolvedValue([]) };
    contracts = { findByRoom: jest.fn() };
    controller = new InvoicesController(svc as any, contracts as any);
  });

  it('a TENANT with an active contract is scoped to that contractId', async () => {
    contracts.findByRoom.mockResolvedValue({ id: 'contract-current' });
    await controller.findAll({ id: 'u1', role: 'TENANT', roomId: 'room-1' }, undefined, undefined, undefined);

    expect(contracts.findByRoom).toHaveBeenCalledWith('room-1');
    expect(svc.findAll).toHaveBeenCalledWith(expect.objectContaining({ contractId: 'contract-current' }));
  });

  it('a TENANT whose room currently has NO active contract sees nothing (not the previous tenant\'s history)', async () => {
    contracts.findByRoom.mockResolvedValue(null);
    await controller.findAll({ id: 'u1', role: 'TENANT', roomId: 'room-1' }, undefined, undefined, undefined);

    expect(svc.findAll).toHaveBeenCalledWith(expect.objectContaining({ contractId: '__none__' }));
  });

  it('a TENANT trying to pass a roomId (own or otherwise) does not bypass the contract scoping', async () => {
    contracts.findByRoom.mockResolvedValue({ id: 'contract-current' });
    await controller.findAll({ id: 'u1', role: 'TENANT', roomId: 'room-1' }, undefined, undefined, 'room-1');

    expect(svc.findAll).toHaveBeenCalledWith(expect.objectContaining({ roomId: 'room-1', contractId: 'contract-current' }));
  });

  it('ADMIN/LANDLORD querying by roomId sees the FULL room history — no contract scoping applied', async () => {
    await controller.findAll({ id: 'u1', role: 'LANDLORD' }, undefined, undefined, 'room-1');

    expect(contracts.findByRoom).not.toHaveBeenCalled();
    expect(svc.findAll).toHaveBeenCalledWith({ status: undefined, period: undefined, roomId: 'room-1', contractId: undefined });
  });
});
