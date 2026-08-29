const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (req.user.role === 'STAFF') {
      where.requesterId = req.user.id;
    }

    if (status) {
      where.status = status;
    }

    const requests = await prisma.request.findMany({
      where,
      include: {
        requester: {
          select: { id: true, name: true, username: true, role: true }
        },
        approver: {
          select: { id: true, name: true, username: true, role: true }
        },
        items: {
          include: {
            item: {
              include: {
                category: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(requests);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve requests', error: error.message });
  }
};

exports.getRequestById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid request ID' });
  }

  try {
    const request = await prisma.request.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, username: true, role: true }
        },
        approver: {
          select: { id: true, name: true, username: true, role: true }
        },
        items: {
          include: {
            item: {
              include: {
                category: true,
                unit: true
              }
            }
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (req.user.role === 'STAFF' && request.requesterId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only view your own requests' });
    }

    return res.status(200).json(request);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve request detail', error: error.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const { purpose, items } = req.body;
    if (!purpose || !Array.isArray(items) || items.length === 0) {
      return res.status(422).json({ message: 'Purpose and items list are required' });
    }

    const lastRequest = await prisma.request.findFirst({
      orderBy: { id: 'desc' }
    });
    const nextId = (lastRequest?.id || 0) + 1;
    const requestCode = `REQ-${String(nextId).padStart(6, '0')}`;

    const newRequest = await prisma.request.create({
      data: {
        requestCode,
        requesterId: req.user.id,
        purpose,
        status: 'PENDING',
        items: {
          create: items.map((i) => ({
            itemId: parseInt(i.itemId, 10),
            quantity: parseInt(i.quantity, 10),
          })),
        },
      },
      include: {
        items: {
          include: { item: true }
        },
        requester: {
          select: { id: true, name: true, username: true, role: true }
        }
      },
    });

    return res.status(201).json(newRequest);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create request', error: error.message });
  }
};

exports.approveRequest = async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) {
    return res.status(400).json({ message: 'Invalid request ID' });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const request = await tx.request.findUnique({
        where: { id: requestId },
        include: {
          items: {
            include: { item: true },
          },
        },
      });

      if (!request) throw new Error('NOT_FOUND: Request does not exist');
      if (request.status !== 'PENDING') throw new Error('CONFLICT: Request is already processed');

      for (const reqItem of request.items) {
        if (reqItem.item.stock < reqItem.quantity) {
          throw new Error(
            `INSUFFICIENT_STOCK: Insufficient stock for ${reqItem.item.name}. Available: ${reqItem.item.stock}, Requested: ${reqItem.quantity}`
          );
        }
      }

      for (const reqItem of request.items) {
        const updatedItem = await tx.item.update({
          where: { id: reqItem.itemId },
          data: { stock: { decrement: reqItem.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            itemId: reqItem.itemId,
            userId: req.user.id,
            type: 'OUT',
            quantity: reqItem.quantity,
            stockBefore: reqItem.item.stock,
            stockAfter: updatedItem.stock,
            description: `Fulfilled Request #${request.requestCode}`,
            referenceType: 'REQUEST_FULFILLMENT',
            referenceId: request.id,
          },
        });
      }

      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approverId: req.user.id,
          approvedAt: new Date(),
        },
        include: {
          items: { include: { item: true } },
          requester: { select: { id: true, name: true, username: true, role: true } },
          approver: { select: { id: true, name: true, username: true, role: true } }
        },
      });

      return updatedRequest;
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.message.startsWith('NOT_FOUND')) return res.status(404).json({ message: error.message.replace('NOT_FOUND: ', '') });
    if (error.message.startsWith('CONFLICT')) return res.status(409).json({ message: error.message.replace('CONFLICT: ', '') });
    if (error.message.startsWith('INSUFFICIENT_STOCK')) return res.status(422).json({ message: error.message.replace('INSUFFICIENT_STOCK: ', '') });

    return res.status(500).json({ message: 'Approval transaction failed', error: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  const requestId = parseInt(req.params.id, 10);
  if (isNaN(requestId)) {
    return res.status(400).json({ message: 'Invalid request ID' });
  }

  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return res.status(422).json({ message: 'Rejection reason is required' });
  }

  try {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(409).json({ message: 'Request already processed' });

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approverId: req.user.id,
        approvedAt: new Date(),
      },
      include: {
        items: { include: { item: true } },
        requester: { select: { id: true, name: true, username: true, role: true } },
        approver: { select: { id: true, name: true, username: true, role: true } }
      }
    });

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
};