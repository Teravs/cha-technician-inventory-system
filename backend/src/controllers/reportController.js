const { PrismaClient } = require('@prisma/client');
const { generatePdfReport } = require('../services/reportService');
const prisma = new PrismaClient();

exports.getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const movements = await prisma.stockMovement.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { item: { include: { category: true, unit: true } }, user: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ period: `${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`, movements });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve weekly report', error: err.message });
  }
};

exports.exportWeeklyPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const pdfBuffer = await generatePdfReport({
      title: 'Weekly Inventory Movement Report',
      period: `${start.toLocaleDateString()} to ${end.toLocaleDateString()}`,
      startDate: start,
      endDate: end
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CHA_Weekly_Report_${start.toISOString().split('T')[0]}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to export weekly PDF', error: err.message });
  }
};

exports.exportMonthlyPdf = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month, 10) - 1 : new Date().getMonth();

    const start = new Date(currentYear, currentMonth, 1);
    const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const pdfBuffer = await generatePdfReport({
      title: 'Monthly Warehouse Inventory Audit Report',
      period: start.toLocaleString('default', { month: 'long', year: 'numeric' }),
      startDate: start,
      endDate: end
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CHA_Monthly_Report_${currentYear}_${currentMonth + 1}.pdf`);
    return res.send(pdfBuffer);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to export monthly PDF', error: err.message });
  }
};