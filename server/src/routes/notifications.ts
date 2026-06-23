import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middlewares/auth";

const router = Router();

/**
 * GET /api/notifications
 * Get all notifications for the logged-in user
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return res.json(notifications);
  } catch (error) {
    console.error("[notifications get error]", error);
    return res.status(500).json({ error: "Failed to retrieve notifications." });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the logged-in user
 */
router.put("/read-all", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    return res.json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("[notifications read all error]", error);
    return res.status(500).json({ error: "Failed to update notifications." });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
router.put("/:id/read", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found." });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return res.json({ message: "Notification marked as read.", notification: updated });
  } catch (error) {
    console.error("[notification read error]", error);
    return res.status(500).json({ error: "Failed to update notification." });
  }
});

export default router;
