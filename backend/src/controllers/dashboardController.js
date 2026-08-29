const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getDashboardData = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { isActive: true },
      include: { category: true, unit: true }
    });

    let readyCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockItems = [];
    const outOfStockItems = [];

    items.forEach((item) => {
      if (item.stock === 0) {
        outOfStockCount++;
        outOfStockItems.push({ ...item, calculatedStatus: 'OUT_OF_STOCK' });
      } else if (item.stock <= item.minimumStock) {
        lowStockCount++;
        lowStockItems.push({ ...item, calculatedStatus: 'LOW_STOCK' });
      } else {
        readyCount++;
      }
    });

    const pendingRequestsCount = await prisma.request.count({
      where: { status: 'PENDING' }
    });

    return res.status(200).json({
      metrics: {
        totalItems: items.length,
        ready: readyCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        pendingRequests: pendingRequestsCount
      },
      lowStockItems,
      outOfStockItems
    });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat dashboard', error: err.message });
  }
};