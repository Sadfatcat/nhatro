const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BACKFILL_START_DATE = new Date('2026-06-04');
const BACKFILL_NOTE = 'Khởi tạo tự động từ dữ liệu cũ — cần bổ sung';

async function main() {
  const tenants = await prisma.tenant.findMany();
  console.log(`Tìm thấy ${tenants.length} tenant.`);

  let created = 0;
  let skipped = 0;

  for (const tenant of tenants) {
    const existing = await prisma.contract.findFirst({
      where: { tenantId: tenant.id, roomId: tenant.roomId, status: 'ACTIVE' },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.contract.create({
      data: {
        roomId:    tenant.roomId,
        tenantId:  tenant.id,
        startDate: BACKFILL_START_DATE,
        status:    'ACTIVE',
        deposit:   0,
        notes:     BACKFILL_NOTE,
      },
    });
    created++;
  }

  console.log(`Đã tạo ${created} contract mới, bỏ qua ${skipped} (đã có contract ACTIVE).`);
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
