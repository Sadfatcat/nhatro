const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@nhatro.vn';
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName: 'Quản trị viên',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      fullName: 'Quản trị viên',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('Admin account ready: admin@nhatro.vn / admin123');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
