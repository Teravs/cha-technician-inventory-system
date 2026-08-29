const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json(categories);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat kategori', error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(422).json({ message: 'Nama kategori wajib diisi' });

  try {
    const category = await prisma.category.create({ data: { name, description } });
    return res.status(201).json(category);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Kategori sudah ada' });
    return res.status(500).json({ message: 'Gagal menambahkan kategori', error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description } = req.body;

  try {
    const updated = await prisma.category.update({ where: { id }, data: { name, description } });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui kategori', error: err.message });
  }
};

exports.toggleCategoryStatus = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const cat = await prisma.category.findUnique({ where: { id } });
    const updated = await prisma.category.update({ where: { id }, data: { isActive: !cat.isActive } });
    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal mengubah status kategori', error: err.message });
  }
};