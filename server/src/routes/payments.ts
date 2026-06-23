import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middlewares/auth";
import { PaymentType, PaymentStatus } from "@prisma/client";

const router = Router();

/**
 * GET /api/payments
 * Retrieve payment transactions list
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { id: userId, role } = req.user!;

  try {
    let payments;

    if (role === "ADMIN") {
      // Admins see all transactions
      payments = await prisma.payment.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, role: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // Customers and Subagents see their own transactions
      payments = await prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      });
    }

    return res.json(payments);
  } catch (error) {
    console.error("[payments get error]", error);
    return res.status(500).json({ error: "Failed to retrieve payment history." });
  }
});

/**
 * POST /api/payments
 * Create & simulate a payment transaction
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { amount, currency, paymentType, metadata } = req.body;

  if (!amount || !paymentType) {
    return res.status(400).json({ error: "Amount and paymentType are required." });
  }

  if (!Object.values(PaymentType).includes(paymentType)) {
    return res.status(400).json({ error: "Invalid payment type." });
  }

  try {
    // Determine target status (simulate successful transaction by default)
    const status = req.body.simulateFail ? PaymentStatus.FAILED : PaymentStatus.COMPLETED;

    // Create the payment log record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: parseFloat(amount),
        currency: currency || "USD",
        paymentType: paymentType as PaymentType,
        status,
        metadata: metadata || null
      }
    });

    // Side effects on successful payment:
    if (status === PaymentStatus.COMPLETED) {
      // 1. If Lead Unlock, automatically unlock the lead for the agent
      if (paymentType === PaymentType.LEAD_UNLOCK && metadata && metadata.leadId) {
        await prisma.lead.update({
          where: { id: metadata.leadId },
          data: { isUnlocked: true }
        });
      }
    }

    return res.status(201).json({
      message: status === PaymentStatus.COMPLETED 
        ? "Payment completed successfully!" 
        : "Payment transaction failed.",
      payment
    });
  } catch (error) {
    console.error("[payment process error]", error);
    return res.status(500).json({ error: "Failed to process payment transaction." });
  }
});

export default router;
