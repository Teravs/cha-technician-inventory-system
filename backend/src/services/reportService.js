const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.generatePdfReport = async ({ title, period, startDate, endDate }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 1. Fetch all stock movements in the date range
  const movements = await prisma.stockMovement.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      item: {
        include: {
          category: true,
          unit: true,
        },
      },
      user: {
        select: { id: true, name: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 2. Fetch linked requests to get the technician requester's name
  const requestIds = movements
    .filter((m) => m.referenceType === 'REQUEST_FULFILLMENT' && m.referenceId)
    .map((m) => m.referenceId);

  let requestMap = {};
  if (requestIds.length > 0) {
    const requests = await prisma.request.findMany({
      where: { id: { in: requestIds } },
      include: {
        requester: { select: { id: true, name: true } },
      },
    });
    requests.forEach((r) => {
      requestMap[r.id] = r;
    });
  }

  // 3. Process movement logs
  const processedMovements = movements.map((m) => {
    const relRequest = m.referenceType === 'REQUEST_FULFILLMENT' && m.referenceId ? requestMap[m.referenceId] : null;
    const technicianName = relRequest?.requester?.name || m.user?.name || '-';
    const referenceNote = relRequest
      ? `#${relRequest.requestCode} (${relRequest.purpose || 'Permintaan Teknisi'})`
      : m.description || '-';

    return {
      id: m.id,
      date: new Date(m.createdAt).toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      itemName: m.item?.name || 'Barang Dihapus',
      itemSpecs: `${m.item?.brand || ''} ${m.item?.size || ''}`.trim(),
      unitSymbol: m.item?.unit?.symbol || 'PCS',
      type: m.type,
      quantity: m.quantity,
      technicianName,
      referenceNote,
    };
  });

  // 4. Fetch all active items for stock recap table
  const items = await prisma.item.findMany({
    where: { isActive: true },
    include: {
      category: true,
      unit: true,
      stockMovements: {
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // 5. Request metrics in the date range
  const requestStats = await prisma.request.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    _count: { _all: true },
  });

  let totalIn = 0;
  let totalOut = 0;

  const statusMap = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  requestStats.forEach((s) => {
    statusMap[s.status] = s._count._all;
  });
  const totalRequests = statusMap.PENDING + statusMap.APPROVED + statusMap.REJECTED;
  const approvalRate = totalRequests > 0 ? Math.round((statusMap.APPROVED / totalRequests) * 100) : 0;

  const processedItems = items.map((item) => {
    let itemIn = 0;
    let itemOut = 0;
    item.stockMovements.forEach((m) => {
      if (m.type === 'IN') itemIn += m.quantity;
      if (m.type === 'OUT') itemOut += m.quantity;
    });

    totalIn += itemIn;
    totalOut += itemOut;

    const netChange = itemIn - itemOut;
    const openingStock = item.stock - netChange;

    return {
      id: item.id,
      name: item.name,
      brand: item.brand,
      size: item.size,
      category: item.category?.name || '-',
      unit: item.unit?.symbol || 'PCS',
      openingStock,
      itemIn,
      itemOut,
      closingStock: item.stock,
    };
  });

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 36, bottom: 36, left: 36, right: 36 },
        bufferPages: true,
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2; // 523.28 pt

      // --- Header ---
      doc.rect(margin, margin, contentWidth, 3).fill('#2563eb');
      doc.y = margin + 12;

      doc.fontSize(13).font('Helvetica-Bold').fillColor('#2563eb').text('CHA TECHNICIAN INVENTORY SYSTEM', margin, doc.y);
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('PT Chand Hajar Aswad - Divisi Operasional & Teknisi', margin, doc.y + 2);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text(title, margin, doc.y + 14);
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(
        `Periode: ${period}   |   Dicetak: ${new Date().toLocaleString('id-ID')}`,
        margin,
        doc.y + 2
      );

      // --- Metrics Summary Cards ---
      const cardY = doc.y + 12;
      const cardHeight = 42;
      const cardWidth = (contentWidth - 24) / 4;

      const metrics = [
        { label: 'TOTAL BARANG MASUK', value: `+${totalIn}`, color: '#16a34a' },
        { label: 'TOTAL BARANG KELUAR', value: `-${totalOut}`, color: '#dc2626' },
        { label: 'TOTAL PERMINTAAN', value: `${totalRequests}`, color: '#0f172a' },
        { label: 'APPROVAL RATE', value: `${approvalRate}%`, color: '#2563eb' },
      ];

      metrics.forEach((m, idx) => {
        const cx = margin + idx * (cardWidth + 8);
        doc.roundedRect(cx, cardY, cardWidth, cardHeight, 4).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748b').text(m.label, cx + 8, cardY + 7);
        doc.fontSize(12).font('Helvetica-Bold').fillColor(m.color).text(m.value, cx + 8, cardY + 20);
      });

      let currentY = cardY + cardHeight + 18;

      // ==========================================
      // SECTION 1: LOG MUTASI RINCIAN PER TANGGAL & TEKNISI
      // ==========================================
      const movementCols = [
        { label: 'Tgl & Waktu', x: margin, width: 72, align: 'left' },
        { label: 'Barang & Spesifikasi', x: margin + 74, width: 125, align: 'left' },
        { label: 'Tipe', x: margin + 201, width: 48, align: 'center' },
        { label: 'Jumlah', x: margin + 251, width: 55, align: 'right' },
        { label: 'Teknisi / PIC', x: margin + 308, width: 105, align: 'left' },
        { label: 'Keterangan / No. Tiket', x: margin + 415, width: 108, align: 'left' },
      ];

      const drawMovementHeader = (y) => {
        doc.rect(margin, y, contentWidth, 18).fill('#f1f5f9');
        doc.rect(margin, y + 18, contentWidth, 0.5).fill('#cbd5e1');
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#334155');
        movementCols.forEach((col) => {
          doc.text(col.label, col.x + 2, y + 5, { width: col.width - 4, align: col.align });
        });
      };

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a').text(
        '1. Rincian Log Mutasi Barang Keluar / Masuk & Permintaan Teknisi',
        margin,
        currentY
      );
      currentY += 14;

      drawMovementHeader(currentY);
      currentY += 20;

      if (processedMovements.length === 0) {
        doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(
          'Tidak ada transaksi mutasi keluar/masuk pada periode ini.',
          margin + 10,
          currentY + 4
        );
        currentY += 22;
      } else {
        processedMovements.forEach((m, idx) => {
          if (currentY > 740) {
            doc.addPage();
            currentY = margin;
            drawMovementHeader(currentY);
            currentY += 20;
          }

          const rowHeight = 22;
          if (idx % 2 === 1) {
            doc.rect(margin, currentY, contentWidth, rowHeight).fill('#fafafa');
          }
          doc.rect(margin, currentY + rowHeight, contentWidth, 0.5).fill('#f1f5f9');

          // Tanggal & Waktu
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(m.date, movementCols[0].x + 2, currentY + 6, {
            width: movementCols[0].width - 4,
            align: 'left',
          });

          // Barang & Spesifikasi
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a').text(m.itemName, movementCols[1].x + 2, currentY + 2, {
            width: movementCols[1].width - 4,
            ellipsis: true,
          });
          doc.font('Helvetica').fontSize(6.5).fillColor('#64748b').text(m.itemSpecs, movementCols[1].x + 2, currentY + 11, {
            width: movementCols[1].width - 4,
            ellipsis: true,
          });

          // Tipe
          const typeBadge = m.type === 'IN' ? 'MASUK' : m.type === 'OUT' ? 'KELUAR' : 'ADJUST';
          const typeColor = m.type === 'IN' ? '#16a34a' : m.type === 'OUT' ? '#dc2626' : '#64748b';
          doc.font('Helvetica-Bold').fontSize(7).fillColor(typeColor).text(typeBadge, movementCols[2].x, currentY + 6, {
            width: movementCols[2].width,
            align: 'center',
          });

          // Jumlah
          const qtyText = m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : `${m.quantity}`;
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor(typeColor).text(`${qtyText} ${m.unitSymbol}`, movementCols[3].x, currentY + 6, {
            width: movementCols[3].width - 4,
            align: 'right',
          });

          // Teknisi / PIC
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a').text(m.technicianName, movementCols[4].x + 2, currentY + 6, {
            width: movementCols[4].width - 4,
            ellipsis: true,
          });

          // Keterangan / Tiket
          doc.font('Helvetica').fontSize(7).fillColor('#475569').text(m.referenceNote, movementCols[5].x + 2, currentY + 6, {
            width: movementCols[5].width - 4,
            ellipsis: true,
          });

          currentY += rowHeight;
        });
      }

      currentY += 16;

      // ==========================================
      // SECTION 2: REKAPITULASI STOK BARANG (SALDO AWAL - AKHIR)
      // ==========================================
      if (currentY > 640) {
        doc.addPage();
        currentY = margin;
      }

      const recapCols = [
        { label: 'ID', x: margin, width: 28, align: 'left' },
        { label: 'Nama Barang & Spesifikasi', x: margin + 30, width: 175, align: 'left' },
        { label: 'Kategori', x: margin + 207, width: 85, align: 'left' },
        { label: 'Awal', x: margin + 294, width: 52, align: 'right' },
        { label: 'Masuk', x: margin + 348, width: 50, align: 'right' },
        { label: 'Keluar', x: margin + 400, width: 50, align: 'right' },
        { label: 'Stok Akhir', x: margin + 452, width: 71, align: 'right' },
      ];

      const drawRecapHeader = (y) => {
        doc.rect(margin, y, contentWidth, 18).fill('#f1f5f9');
        doc.rect(margin, y + 18, contentWidth, 0.5).fill('#cbd5e1');
        doc.font('Helvetica-Bold').fontSize(7).fillColor('#334155');
        recapCols.forEach((col) => {
          doc.text(col.label, col.x + 2, y + 5, { width: col.width - 4, align: col.align });
        });
      };

      doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#0f172a').text(
        '2. Ringkasan Rekap Saldo Stok Inventaris',
        margin,
        currentY
      );
      currentY += 14;

      drawRecapHeader(currentY);
      currentY += 20;

      if (processedItems.length === 0) {
        doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(
          'Belum ada master data barang inventaris.',
          margin + 10,
          currentY + 4
        );
        currentY += 22;
      } else {
        processedItems.forEach((item, index) => {
          if (currentY > 740) {
            doc.addPage();
            currentY = margin;
            drawRecapHeader(currentY);
            currentY += 20;
          }

          const rowHeight = 22;
          if (index % 2 === 1) {
            doc.rect(margin, currentY, contentWidth, rowHeight).fill('#fafafa');
          }
          doc.rect(margin, currentY + rowHeight, contentWidth, 0.5).fill('#f1f5f9');

          // ID
          doc.font('Helvetica').fontSize(7.5).fillColor('#64748b').text(`#${item.id}`, recapCols[0].x + 2, currentY + 6, {
            width: recapCols[0].width - 4,
            align: 'left',
          });

          // Name & Specs
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a').text(item.name, recapCols[1].x + 2, currentY + 2, {
            width: recapCols[1].width - 4,
            ellipsis: true,
          });
          doc.font('Helvetica').fontSize(6.5).fillColor('#64748b').text(
            `${item.brand} | ${item.size}`,
            recapCols[1].x + 2,
            currentY + 11,
            { width: recapCols[1].width - 4, ellipsis: true }
          );

          // Category
          doc.font('Helvetica').fontSize(7).fillColor('#334155').text(item.category, recapCols[2].x + 2, currentY + 6, {
            width: recapCols[2].width - 4,
            ellipsis: true,
          });

          // Opening
          doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(
            `${item.openingStock}`,
            recapCols[3].x,
            currentY + 6,
            { width: recapCols[3].width - 4, align: 'right' }
          );

          // In
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#16a34a').text(
            item.itemIn > 0 ? `+${item.itemIn}` : '0',
            recapCols[4].x,
            currentY + 6,
            { width: recapCols[4].width - 4, align: 'right' }
          );

          // Out
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#dc2626').text(
            item.itemOut > 0 ? `-${item.itemOut}` : '0',
            recapCols[5].x,
            currentY + 6,
            { width: recapCols[5].width - 4, align: 'right' }
          );

          // Closing
          doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a').text(
            `${item.closingStock} ${item.unit}`,
            recapCols[6].x,
            currentY + 6,
            { width: recapCols[6].width - 4, align: 'right' }
          );

          currentY += rowHeight;
        });
      }

      // --- Footer / Signatures ---
      if (currentY > 670) {
        doc.addPage();
        currentY = margin;
      } else {
        currentY += 18;
      }

      doc.rect(margin, currentY, contentWidth, 0.5).fill('#cbd5e1');
      currentY += 10;

      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text(
        'Laporan ini digenerate secara otomatis oleh CHA Technician Inventory System.',
        margin,
        currentY
      );

      const signY = currentY + 16;
      doc.fontSize(8).font('Helvetica').fillColor('#334155').text('Disetujui Oleh:', contentWidth - 110, signY);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a').text(
        'Kepala Teknisi & Operasional',
        contentWidth - 110,
        signY + 45
      );
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text(
        'PT Chand Hajar Aswad',
        contentWidth - 110,
        signY + 56
      );

      // Page Numbers
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(
          `Halaman ${i + 1} dari ${totalPages}`,
          margin,
          810,
          { width: contentWidth, align: 'center' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};