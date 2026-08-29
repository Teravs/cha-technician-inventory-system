const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllUnits = async (req, res) => {
  try {
    const units = await prisma.unit.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json(units);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat unit', error: err.message });
  }
};

exports.createUnit = async (req, res) => {
  const { name, symbol } = req.body;
  if (!name || !symbol) return res.status(422).json({ message: 'Nama dan simbol unit wajib diisi' });

  try {
    const unit = await prisma.unit.create({ data: { name, symbol } });
    return res.status(201).json(unit);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Nama atau simbol unit sudah terdaftar' });
    return res.status(500).json({ message: 'Gagal menambahkan unit', error: err.message });
  }
};

exports.updateUnit = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, symbol } = req.body;

  try {
    const updated = await prisma.unit.update({ where: { id }, data: { name, symbol } });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui unit', error: err.message });
  }
};

exports.toggleUnitStatus = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const unit = await prisma.unit.findUnique({ where: { id } });
    const updated = await prisma.unit.update({ where: { id }, data: { isActive: !unit.isActive } });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengubah status unit', error: err.message });
  }
};