const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.generatePdfReport = async ({ title, period, startDate, endDate }) => {
  const items = await prisma.item.findMany({
    where: { isActive: true },
    include: {
      category: true,
      unit: true,
      stockMovements: {
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const requestStats = await prisma.request.groupBy({
    by: ['status'],
    where: {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate),
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
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = 595.28;
      const contentWidth = pageWidth - 80;

      // --- Header ---
      doc.rect(40, 40, contentWidth, 3).fill('#2563eb');
      doc.y = 52;

      doc.fontSize(14).font('Helvetica-Bold').fillColor('#2563eb').text('CHA TECHNICIAN INVENTORY SYSTEM', 40, 52);
      doc.fontSize(9).font('Helvetica').fillColor('#64748b').text('PT Chand Hajar Aswad - Warehouse & Operations', 40, 68);

      doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a').text(title, 40, 88);
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(
        `Periode: ${period}   |   Dicetak: ${new Date().toLocaleString('id-ID')}`,
        40,
        104
      );

      // --- Metrics Summary Cards ---
      const cardY = 124;
      const cardHeight = 44;
      const cardWidth = (contentWidth - 24) / 4;

      const metrics = [
        { label: 'TOTAL IN', value: `+${totalIn}`, color: '#16a34a' },
        { label: 'TOTAL OUT', value: `-${totalOut}`, color: '#dc2626' },
        { label: 'TOTAL PERMINTAAN', value: `${totalRequests}`, color: '#0f172a' },
        { label: 'APPROVAL RATE', value: `${approvalRate}%`, color: '#2563eb' },
      ];

      metrics.forEach((m, idx) => {
        const cx = 40 + idx * (cardWidth + 8);
        doc.roundedRect(cx, cardY, cardWidth, cardHeight, 4).fillAndStroke('#f8fafc', '#e2e8f0');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#64748b').text(m.label, cx + 8, cardY + 8);
        doc.fontSize(13).font('Helvetica-Bold').fillColor(m.color).text(m.value, cx + 8, cardY + 22);
      });

      // --- Table Configuration ---
      const tableTop = 184;
      let currentY = tableTop;

      const cols = [
        { label: 'ID', x: 40, width: 28, align: 'left' },
        { label: 'Nama Barang & Spesifikasi', x: 70, width: 180, align: 'left' },
        { label: 'Kategori', x: 252, width: 85, align: 'left' },
        { label: 'Awal', x: 339, width: 42, align: 'right' },
        { label: 'Masuk', x: 383, width: 40, align: 'right' },
        { label: 'Keluar', x: 425, width: 40, align: 'right' },
        { label: 'Akhir', x: 467, width: 48, align: 'right' },
      ];

      const drawTableHeader = (y) => {
        doc.rect(40, y, contentWidth, 20).fill('#f1f5f9');
        doc.rect(40, y + 20, contentWidth, 0.5).fill('#cbd5e1');
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#334155');
        cols.forEach((col) => {
          doc.text(col.label, col.x + 2, y + 6, { width: col.width - 4, align: col.align });
        });
      };

      drawTableHeader(currentY);
      currentY += 22;

      processedItems.forEach((item, index) => {
        // Page break check (leave room for row and signature/footer)
        if (currentY > 730) {
          doc.addPage();
          currentY = 40;
          drawTableHeader(currentY);
          currentY += 22;
        }

        const rowHeight = 24;
        if (index % 2 === 1) {
          doc.rect(40, currentY, contentWidth, rowHeight).fill('#fafafa');
        }
        doc.rect(40, currentY + rowHeight, contentWidth, 0.5).fill('#f1f5f9');

        // ID
        doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`#${item.id}`, cols[0].x + 2, currentY + 7, {
          width: cols[0].width - 4,
          align: 'left',
        });

        // Name & Specs
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(item.name, cols[1].x + 2, currentY + 3, {
          width: cols[1].width - 4,
          ellipsis: true,
        });
        doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(
          `${item.brand} | ${item.size}`,
          cols[1].x + 2,
          currentY + 13,
          { width: cols[1].width - 4, ellipsis: true }
        );

        // Category
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155').text(item.category, cols[2].x + 2, currentY + 7, {
          width: cols[2].width - 4,
          ellipsis: true,
        });

        // Opening
        doc.font('Helvetica').fontSize(8).fillColor('#334155').text(
          `${item.openingStock}`,
          cols[3].x,
          currentY + 7,
          { width: cols[3].width - 4, align: 'right' }
        );

        // In
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#16a34a').text(
          item.itemIn > 0 ? `+${item.itemIn}` : '0',
          cols[4].x,
          currentY + 7,
          { width: cols[4].width - 4, align: 'right' }
        );

        // Out
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#dc2626').text(
          item.itemOut > 0 ? `-${item.itemOut}` : '0',
          cols[5].x,
          currentY + 7,
          { width: cols[5].width - 4, align: 'right' }
        );

        // Closing
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(
          `${item.closingStock} ${item.unit}`,
          cols[6].x,
          currentY + 7,
          { width: cols[6].width - 4, align: 'right' }
        );

        currentY += rowHeight;
      });

      // --- Footer / Signatures ---
      if (currentY > 680) {
        doc.addPage();
        currentY = 40;
      } else {
        currentY += 20;
      }

      doc.rect(40, currentY, contentWidth, 0.5).fill('#cbd5e1');
      currentY += 12;

      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(
        'Laporan ini digenerate secara otomatis oleh CHA Technician Inventory System.',
        40,
        currentY
      );

      const signY = currentY + 20;
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
        doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8').text(
          `Halaman ${i + 1} dari ${totalPages}`,
          40,
          800,
          { width: contentWidth, align: 'center' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};