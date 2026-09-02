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

    const requestIds = movements
      .filter((m) => m.referenceType === 'REQUEST_FULFILLMENT' && m.referenceId)
      .map((m) => m.referenceId);

    let requestMap = {};
    if (requestIds.length > 0) {
      const requests = await prisma.request.findMany({
        where: { id: { in: requestIds } },
        include: {
          requester: { select: { id: true, name: true, username: true } }
        }
      });
      requests.forEach((r) => {
        requestMap[r.id] = r;
      });
    }

    const enhancedMovements = movements.map((m) => {
      const relRequest = m.referenceType === 'REQUEST_FULFILLMENT' && m.referenceId ? requestMap[m.referenceId] : null;
      return {
        ...m,
        technicianName: relRequest?.requester?.name || null,
        requestCode: relRequest?.requestCode || null,
        requestPurpose: relRequest?.purpose || null,
      };
    });

    return res.status(200).json(enhancedMovements);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat riwayat mutasi', error: err.message });
  }
};