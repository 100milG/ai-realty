import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest, authorizeRoles } from "../middlewares/auth";
import { MessageSenderType } from "@prisma/client";

const router = Router();

/**
 * GET /api/messages/sessions
 * Get list of all active chat sessions the current user participates in
 */
router.get("/sessions", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const participantSessions = await prisma.chatParticipant.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, role: true }
                }
              }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    const sessions = participantSessions.map(p => p.session);
    return res.json(sessions);
  } catch (error) {
    console.error("[chat sessions error]", error);
    return res.status(500).json({ error: "Failed to retrieve chat sessions." });
  }
});

/**
 * GET /api/messages/admin/monitor
 * Retrieve all chat sessions on the platform for admin auditing (Restricted to ADMIN)
 */
router.get("/admin/monitor", authenticateToken, authorizeRoles("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await prisma.chatSession.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, role: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    return res.json(sessions);
  } catch (error) {
    console.error("[admin monitor sessions error]", error);
    return res.status(500).json({ error: "Failed to retrieve chat sessions for monitoring." });
  }
});

/**
 * GET /api/messages/lead/:leadId
 * Retrieve or create a chat session associated with a lead
 */
router.get("/lead/:leadId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { leadId } = req.params;
  const { id: userId, role } = req.user!;

  try {
    // 1. Fetch the lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        property: {
          include: {
            locality: true
          }
        },
        customer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        subagent: {
          select: { id: true, name: true, email: true, phone: true }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: "Lead not found." });
    }

    // Check authorization
    if (lead.customerId !== userId && lead.subagentId !== userId && role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden. You are not authorized for this lead." });
    }

    // 2. Find a chat session containing the participants and having metadata matching the leadId
    // We do a search where we find the sessions for user, and filter by metadata
    const participantSessions = await prisma.chatParticipant.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, role: true }
                }
              }
            }
          }
        }
      }
    });

    let session = participantSessions.find(p => {
      const meta = p.session.metadata as any;
      return meta && meta.leadId === leadId;
    })?.session;

    // Fallback: Find by subject and matching user
    if (!session) {
      const candidateSessions = await prisma.chatSession.findMany({
        where: {
          subject: `Inquiry: ${lead.property.title}`,
          participants: {
            some: { userId: lead.customerId }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, role: true }
              }
            }
          }
        }
      });
      
      session = candidateSessions[0];

      if (session) {
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { metadata: { leadId } }
        });
      }
    }

    // 3. Create if still doesn't exist
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          subject: `Inquiry: ${lead.property.title}`,
          isAI: false,
          metadata: { leadId },
          participants: {
            create: [
              { userId: lead.customerId, role: "customer" },
              ...(lead.subagentId ? [{ userId: lead.subagentId, role: "subagent" }] : [])
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, role: true }
              }
            }
          }
        }
      });
    }

    return res.json({
      session,
      lead
    });
  } catch (error) {
    console.error("[get lead session error]", error);
    return res.status(500).json({ error: "Failed to retrieve chat session for lead." });
  }
});

/**
 * GET /api/messages/:sessionId
 * Fetch conversation messages for a chat session (Checks participant access)
 */
router.get("/:sessionId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const { id: userId, role } = req.user!;

  try {
    // 1. Verify user is a participant or is an admin
    if (role !== "ADMIN") {
      const isParticipant = await prisma.chatParticipant.findUnique({
        where: {
          sessionId_userId: { sessionId, userId }
        }
      });

      if (!isParticipant) {
        return res.status(403).json({ error: "Forbidden. You are not a participant in this conversation." });
      }
    }

    // 2. Retrieve messages
    const messages = await prisma.message.findMany({
      where: { sessionId },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    return res.json(messages);
  } catch (error) {
    console.error("[messages get error]", error);
    return res.status(500).json({ error: "Failed to retrieve messages." });
  }
});

/**
 * POST /api/messages
 * Send a message within a chat session
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { sessionId, content } = req.body;
  const { id: senderId, role } = req.user!;

  if (!sessionId || !content) {
    return res.status(400).json({ error: "Session ID and message content are required." });
  }

  try {
    // 1. Verify session exists and sender is participant
    const isParticipant = await prisma.chatParticipant.findUnique({
      where: {
        sessionId_userId: { sessionId, userId: senderId }
      }
    });

    if (!isParticipant) {
      return res.status(403).json({ error: "Forbidden. You are not a participant in this conversation." });
    }

    // Map sender role to MessageSenderType enum
    let senderType: MessageSenderType = MessageSenderType.USER;
    if (role === "SUBAGENT") senderType = MessageSenderType.SUBAGENT;
    if (role === "ADMIN") senderType = MessageSenderType.ADMIN;

    // 2. Create message
    const message = await prisma.message.create({
      data: {
        sessionId,
        senderId,
        senderType,
        content
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error("[message send error]", error);
    return res.status(500).json({ error: "Failed to send message." });
  }
});

export default router;
