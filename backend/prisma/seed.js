const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CHA Inventory Database...');

  // Bersihkan data lama jika ada
  await prisma.stockMovement.deleteMany();
  await prisma.requestItem.deleteMany();
  await prisma.request.deleteMany();
  await prisma.item.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Roles & Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const kepalaPassword = await bcrypt.hash('kepala123', 10);
  const teknisiPassword = await bcrypt.hash('teknisi123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: adminPassword,
      name: 'Super Admin CHA',
      role: 'SUPER_ADMIN',
    },
    create: {
      name: 'Super Admin CHA',
      username: 'admin',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const kepala = await prisma.user.upsert({
    where: { username: 'kepala' },
    update: {
      password: kepalaPassword,
      name: 'Bambang Sudarmono (Kepala Teknisi)',
      role: 'KEPALA',
    },
    create: {
      name: 'Bambang Sudarmono (Kepala Teknisi)',
      username: 'kepala',
      password: kepalaPassword,
      role: 'KEPALA',
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: 'teknisi' },
    update: {
      password: teknisiPassword,
      name: 'Ahmad Fauzi (Teknisi Lapangan)',
      role: 'STAFF',
    },
    create: {
      name: 'Ahmad Fauzi (Teknisi Lapangan)',
      username: 'teknisi',
      password: teknisiPassword,
      role: 'STAFF',
      isActive: true,
    },
  });

  console.log('Users seeded:', {
    superAdmin: superAdmin.username,
    kepala: kepala.username,
    staff: staff.username,
  });

  // 2. Seed Units (4 Satuan)
  const units = await Promise.all([
    prisma.unit.upsert({ where: { symbol: 'PCS' }, update: {}, create: { name: 'Pieces', symbol: 'PCS' } }),
    prisma.unit.upsert({ where: { symbol: 'LTR' }, update: {}, create: { name: 'Liter', symbol: 'LTR' } }),
    prisma.unit.upsert({ where: { symbol: 'MTR' }, update: {}, create: { name: 'Meter', symbol: 'MTR' } }),
    prisma.unit.upsert({ where: { symbol: 'KG' }, update: {}, create: { name: 'Kilogram', symbol: 'KG' } }),
  ]);

  // 3. Seed Categories (2 Kategori)
  const categories = await Promise.all([
    prisma.category.upsert({ where: { name: 'Electrical Components' }, update: {}, create: { name: 'Electrical Components', description: 'Komponen dan perangkat elektrikal' } }),
    prisma.category.upsert({ where: { name: 'Cables & Wiring' }, update: {}, create: { name: 'Cables & Wiring', description: 'Kabel, kawat penghantar, dan perkabelan' } }),
  ]);

  console.log('Database berhasil diset: 3 User, 2 Kategori, 4 Satuan.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });