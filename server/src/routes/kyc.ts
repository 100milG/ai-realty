import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, authorizeRoles, AuthRequest } from "../middlewares/auth";
import { KYCStatus } from "@prisma/client";

const router = Router();

/**
 * GET /api/kyc
 * Fetch KYC request (for Subagent) or all requests (for Admin review)
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id: userId, role } = req.user!;

  try {
    if (role === "SUBAGENT") {
      // Subagent retrieves their own KYC details
      const kyc = await prisma.kYCVerification.findUnique({
        where: { userId }
      });
      return res.json(kyc || { status: "UNSUBMITTED" });
    } else if (role === "ADMIN") {
      // Admin retrieves all requests needing approval
      const requests = await prisma.kYCVerification.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      return res.json(requests);
    } else {
      return res.status(403).json({ error: "Forbidden." });
    }
  } catch (error) {
    console.error("[kyc get error]", error);
    return res.status(500).json({ error: "Failed to retrieve KYC details." });
  }
});

/**
 * POST /api/kyc
 * Submit KYC documents (Restricted to SUBAGENT)
 */
router.post("/", authenticateToken, authorizeRoles("SUBAGENT"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { documents } = req.body; // Expect key-value dictionary of uploaded docs

  if (!documents) {
    return res.status(400).json({ error: "No document details provided." });
  }

  try {
    const existingKyc = await prisma.kYCVerification.findUnique({
      where: { userId }
    });

    let kyc;

    if (existingKyc) {
      // Re-submit documents
      kyc = await prisma.kYCVerification.update({
        where: { userId },
        data: {
          documents,
          status: KYCStatus.PENDING,
          reviewedById: null,
          reviewedAt: null
        }
      });
    } else {
      // New submission
      kyc = await prisma.kYCVerification.create({
        data: {
          userId,
          documents,
          status: KYCStatus.PENDING
        }
      });
    }

    return res.status(201).json({
      message: "KYC documents submitted successfully! Under review.",
      kyc
    });
  } catch (error) {
    console.error("[kyc post error]", error);
    return res.status(500).json({ error: "Failed to submit KYC details." });
  }
});

/**
 * PUT /api/kyc/:id/status
 * Approve or reject KYC verification (Restricted to ADMIN)
 */
router.put("/:id/status", authenticateToken, authorizeRoles("ADMIN"), async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, feedback } = req.body; // e.g. APPROVED or REJECTED

  if (!status || !Object.values(KYCStatus).includes(status)) {
    return res.status(400).json({ error: "Invalid status value." });
  }

  try {
    const updatedKyc = await prisma.kYCVerification.update({
      where: { id },
      data: {
        status: status as KYCStatus,
        adminFeedback: feedback || null,
        reviewedById: req.user!.id,
        reviewedAt: new Date()
      }
    });

    return res.json({
      message: `KYC verification status updated to ${status}!`,
      kyc: updatedKyc
    });
  } catch (error) {
    console.error("[kyc status error]", error);
    return res.status(500).json({ error: "Failed to update KYC status." });
  }
});

export default router;
