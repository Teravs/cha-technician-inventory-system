const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllMovements = async (req, res) => {
  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        item: { include: { unit: true, category: true } },
        user: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(movements);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat riwayat mutasi', error: err.message });
  }
};