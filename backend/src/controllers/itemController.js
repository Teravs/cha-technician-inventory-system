const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllItems = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      include: { category: true, unit: true },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json(items);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat barang', error: err.message });
  }
};

exports.getItemById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
        stockMovements: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!item) return res.status(404).json({ message: 'Barang tidak ditemukan' });
    return res.status(200).json(item);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat detail barang', error: err.message });
  }
};

exports.createItem = async (req, res) => {
  const { name, brand, size, stock, minimumStock, minStock, categoryId, unitId } = req.body;
  const initialStock = parseInt(stock, 10) || 0;
  const limitMinStock = parseInt(minimumStock || minStock, 10) || 0;

  try {
    const newItem = await prisma.$transaction(async (tx) => {
      const created = await tx.item.create({
        data: {
          name,
          brand,
          size,
          stock: initialStock,
          minimumStock: limitMinStock,
          categoryId: parseInt(categoryId, 10),
          unitId: parseInt(unitId, 10)
        }
      });

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: {
            itemId: created.id,
            userId: req.user.id,
            type: 'IN',
            quantity: initialStock,
            stockBefore: 0,
            stockAfter: initialStock,
            description: 'Stok Awal Barang',
            referenceType: 'INITIAL_STOCK',
            referenceId: created.id
          }
        });
      }
      return created;
    });

    return res.status(201).json(newItem);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal membuat barang baru', error: err.message });
  }
};

exports.updateItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, brand, size, minimumStock, minStock, categoryId, unitId } = req.body;

  try {
    const updated = await prisma.item.update({
      where: { id },
      data: {
        name,
        brand,
        size,
        minimumStock: parseInt(minimumStock || minStock, 10),
        categoryId: parseInt(categoryId, 10),
        unitId: parseInt(unitId, 10)
      }
    });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui barang', error: err.message });
  }
};

exports.adjustStock = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { type, quantity, reason } = req.body;
  const qty = parseInt(quantity, 10);

  if (!['IN', 'OUT', 'ADJUSTMENT'].includes(type) || !qty || qty <= 0) {
    return res.status(422).json({ message: 'Parameter mutasi stok tidak valid' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.findUnique({ where: { id } });
      if (!item) throw new Error('Item not found');

      let newStock = item.stock;
      if (type === 'IN') newStock += qty;
      if (type === 'OUT') {
        if (item.stock < qty) throw new Error(`Stok tidak mencukupi (Tersedia: ${item.stock})`);
        newStock -= qty;
      }
      if (type === 'ADJUSTMENT') newStock = qty;

      const updatedItem = await tx.item.update({
        where: { id },
        data: { stock: newStock }
      });

      await tx.stockMovement.create({
        data: {
          itemId: id,
          userId: req.user.id,
          type,
          quantity: qty,
          stockBefore: item.stock,
          stockAfter: newStock,
          description: reason || `Manual Stock Adjustment (${type})`,
          referenceType: 'MANUAL_ADJUSTMENT'
        }
      });

      return updatedItem;
    });

    return res.status(200).json(result);
  } catch (err) {
    return res.status(422).json({ message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID barang tidak valid' });
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            requestItems: true,
            stockMovements: true
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ message: 'Barang tidak ditemukan' });
    }

    if (item._count.stockMovements > 0 || item._count.requestItems > 0) {
      await prisma.item.update({
        where: { id },
        data: { isActive: false }
      });
      return res.status(200).json({
        message: 'Barang memiliki riwayat transaksi/mutasi sehingga dinonaktifkan (arsip) untuk menjaga integritas data audit.',
        isArchived: true
      });
    }

    await prisma.item.delete({ where: { id } });
    return res.status(200).json({ message: 'Barang berhasil dihapus secara permanen.', isArchived: false });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus barang', error: err.message });
  }
};