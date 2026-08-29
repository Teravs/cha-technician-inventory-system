const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true, role: true, isActive: true, createdAt: true },
      orderBy: { id: 'asc' }
    });
    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memuat pengguna', error: err.message });
  }
};

exports.createUser = async (req, res) => {
  const { name, username, password, role } = req.body;
  if (!name || !username || !password || !role) {
    return res.status(422).json({ message: 'Semua field wajib diisi' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { name, username, password: hashedPassword, role },
      select: { id: true, name: true, username: true, role: true, isActive: true }
    });
    return res.status(201).json(newUser);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Username sudah terdaftar' });
    return res.status(500).json({ message: 'Gagal membuat pengguna', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID pengguna tidak valid' });
  }

  const { name, username, password, role } = req.body;
  if (!name || !username || !role) {
    return res.status(422).json({ message: 'Nama, username, dan role wajib diisi' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

    if (username !== user.username) {
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing && existing.id !== id) {
        return res.status(409).json({ message: 'Username sudah digunakan oleh pengguna lain' });
      }
    }

    const dataToUpdate = { name, username, role };
    if (password && password.trim() !== '') {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: { id: true, name: true, username: true, role: true, isActive: true, updatedAt: true }
    });

    return res.status(200).json(updated);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Username sudah terdaftar' });
    return res.status(500).json({ message: 'Gagal memperbarui pengguna', error: err.message });
  }
};

exports.toggleStatus = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan' });

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive }
    });
    return res.status(200).json({ message: 'Status berhasil diperbarui', isActive: updated.isActive });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal memperbarui status', error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID pengguna tidak valid' });
  }

  if (req.user.id === id) {
    return res.status(400).json({ message: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            createdRequests: true,
            approvedRequests: true,
            stockMovements: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }

    if (
      user._count.createdRequests > 0 ||
      user._count.approvedRequests > 0 ||
      user._count.stockMovements > 0
    ) {
      await prisma.user.update({
        where: { id },
        data: { isActive: false }
      });
      return res.status(200).json({
        message: 'Pengguna memiliki riwayat transaksi/audit sehingga dinonaktifkan (arsip) untuk menjaga integritas data.',
        isArchived: true
      });
    }

    await prisma.user.delete({ where: { id } });
    return res.status(200).json({ message: 'Pengguna berhasil dihapus secara permanen.', isArchived: false });
  } catch (err) {
    return res.status(500).json({ message: 'Gagal menghapus pengguna', error: err.message });
  }
};