import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, authorizeRoles, AuthRequest } from "../middlewares/auth";
import { VisitStatus } from "@prisma/client";

const router = Router();

/**
 * GET /api/visits
 * Retrieve visit schedules for the logged-in user (Customer, Agent, or Admin)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id: userId, role } = req.user!;

  try {
    let visits;

    if (role === "CUSTOMER") {
      visits = await prisma.visitSchedule.findMany({
        where: { customerId: userId },
        include: {
          property: { include: { locality: true } },
          subagent: { select: { id: true, name: true, email: true, phone: true } }
        },
        orderBy: { scheduledAt: "asc" }
      });
    } else if (role === "SUBAGENT") {
      visits = await prisma.visitSchedule.findMany({
        where: { subagentId: userId },
        include: {
          property: { include: { locality: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } }
        },
        orderBy: { scheduledAt: "asc" }
      });
    } else {
      // ADMIN role sees all visits
      visits = await prisma.visitSchedule.findMany({
        include: {
          property: true,
          customer: { select: { id: true, name: true, email: true } },
          subagent: { select: { id: true, name: true, email: true } }
        },
        orderBy: { scheduledAt: "asc" }
      });
    }

    return res.json(visits);
  } catch (error) {
    console.error("[visits get error]", error);
    return res.status(500).json({ error: "Failed to retrieve visit schedules." });
  }
});

/**
 * POST /api/visits
 * Request a property visit (Restricted to CUSTOMER)
 */
router.post("/", authenticateToken, authorizeRoles("CUSTOMER"), async (req: AuthRequest, res: Response) => {
  const customerId = req.user!.id;
  const { propertyId, scheduledAt, notes } = req.body;

  if (!propertyId || !scheduledAt) {
    return res.status(400).json({ error: "Property ID and scheduled time are required." });
  }

  try {
    // 1. Verify property exists and fetch its agent(s)
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        agents: {
          orderBy: { primaryAgent: "desc" },
          take: 1
        }
      }
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    // Determine the assigned agent (default to first agent or null if none assigned yet)
    const subagentId = property.agents?.[0]?.subagentId || null;

    // 2. Create the visit request
    const visit = await prisma.visitSchedule.create({
      data: {
        propertyId,
        customerId,
        subagentId,
        scheduledAt: new Date(scheduledAt),
        status: VisitStatus.REQUESTED,
        notes
      }
    });

    return res.status(201).json({
      message: "Visit request submitted successfully!",
      visit
    });
  } catch (error) {
    console.error("[visit create error]", error);
    return res.status(500).json({ error: "Failed to request visit." });
  }
});

/**
 * PUT /api/visits/:id/status
 * Update visit schedule status (Restricted to SUBAGENT or ADMIN)
 */
router.put("/:id/status", authenticateToken, authorizeRoles("SUBAGENT", "ADMIN"), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const { id: userId, role } = req.user!;

  if (!status || !Object.values(VisitStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid visit status." });
  }

  try {
    // 1. Verify visit exists
    const visit = await prisma.visitSchedule.findUnique({
      where: { id }
    });

    if (!visit) {
      return res.status(404).json({ error: "Visit request not found." });
    }

    // 2. Check authorization if user is a subagent
    if (role === "SUBAGENT" && visit.subagentId !== userId) {
      return res.status(403).json({ error: "Unauthorized. This visit is assigned to another agent." });
    }

    // 3. Update the visit status and notes
    const updatedVisit = await prisma.visitSchedule.update({
      where: { id },
      data: {
        status: status as VisitStatus,
        notes: notes !== undefined ? notes : visit.notes
      }
    });

    return res.json({
      message: `Visit schedule status updated to ${status}!`,
      visit: updatedVisit
    });
  } catch (error) {
    console.error("[visit update error]", error);
    return res.status(500).json({ error: "Failed to update visit status." });
  }
});

export default router;
