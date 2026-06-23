import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middlewares/auth";
import { LeadStatus } from "@prisma/client";

const router = Router();

/**
 * GET /api/leads
 * Fetch active leads for the current logged-in user (Customer, Agent, or Admin)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id: userId, role } = req.user!;

  try {
    let leads;

    if (role === "CUSTOMER") {
      // Customers see leads they created
      leads = await prisma.lead.findMany({
        where: { customerId: userId },
        include: {
          property: {
            include: { locality: true }
          },
          subagent: {
            select: { id: true, name: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } else if (role === "SUBAGENT") {
      // Subagents see leads assigned to them
      leads = await prisma.lead.findMany({
        where: { subagentId: userId },
        include: {
          property: {
            include: { locality: true }
          },
          customer: {
            select: { id: true, name: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // Admins see all leads in the system
      leads = await prisma.lead.findMany({
        include: {
          property: true,
          customer: { select: { id: true, name: true, email: true } },
          subagent: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    return res.json(leads);
  } catch (error) {
    console.error("[leads get error]", error);
    return res.status(500).json({ error: "Failed to retrieve leads." });
  }
});

/**
 * POST /api/leads
 * Create a new lead for a property (Restricted to CUSTOMER)
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { propertyId, subagentId } = req.body;
  const customerId = req.user!.id;

  if (!propertyId) {
    return res.status(400).json({ error: "Property ID is required." });
  }

  try {
    // Check if the property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    // Check if user already has an active lead for this property
    const existingLead = await prisma.lead.findFirst({
      where: {
        customerId,
        propertyId
      }
    });

    if (existingLead) {
      return res.json({
        message: "You already have an active conversation for this property.",
        lead: existingLead
      });
    }

    // Create the lead
    const newLead = await prisma.lead.create({
      data: {
        propertyId,
        customerId,
        subagentId: subagentId || null, // Optional, can be assigned later
        status: LeadStatus.NEW,
        isUnlocked: false
      }
    });

    // Create a corresponding chat session automatically for communication
    const chatSession = await prisma.chatSession.create({
      data: {
        subject: `Inquiry: ${property.title}`,
        isAI: false,
        participants: {
          create: [
            { userId: customerId, role: "customer" },
            ...(subagentId ? [{ userId: subagentId, role: "subagent" }] : [])
          ]
        }
      }
    });

    return res.status(201).json({
      message: "Lead created and chat session established successfully!",
      lead: newLead,
      chatSessionId: chatSession.id
    });
  } catch (error) {
    console.error("[lead create error]", error);
    return res.status(500).json({ error: "Failed to create lead." });
  }
});

/**
 * PUT /api/leads/:id/unlock
 * Unlock a lead (Agent pays to unlock contact info - Restricted to SUBAGENT)
 */
router.put("/:id/unlock", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    if (lead.subagentId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized. This lead is assigned to another agent." });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { isUnlocked: true }
    });

    return res.json({
      message: "Lead contact details unlocked successfully!",
      lead: updatedLead
    });
  } catch (error) {
    console.error("[lead unlock error]", error);
    return res.status(500).json({ error: "Failed to unlock lead." });
  }
});

/**
 * PUT /api/leads/:id/status
 * Update lead status (Restricted to SUBAGENT or ADMIN)
 */
router.put("/:id/status", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !Object.values(LeadStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid lead status." });
  }

  try {
    const lead = await prisma.lead.findUnique({
      where: { id }
    });

    if (!lead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    if (lead.subagentId !== req.user!.id && req.user!.role !== "ADMIN") {
      return res.status(403).json({ error: "Unauthorized. This lead is assigned to another agent." });
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status: status as LeadStatus },
      include: {
        property: { include: { locality: true } },
        customer: { select: { id: true, name: true, email: true, phone: true } }
      }
    });

    return res.json({
      message: "Lead status updated successfully!",
      lead: updatedLead
    });
  } catch (error) {
    console.error("[lead status update error]", error);
    return res.status(500).json({ error: "Failed to update lead status." });
  }
});

export default router;
