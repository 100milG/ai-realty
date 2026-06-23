import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, AuthRequest } from "../middlewares/auth";

const router = Router();

/**
 * GET /api/saved-properties
 * Retrieve all properties saved by the logged-in user
 */
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const saved = await prisma.savedProperty.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            locality: true,
            media: {
              take: 1
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Flatten representation for client ease
    const properties = saved.map(s => s.property);
    return res.json(properties);
  } catch (error) {
    console.error("[saved properties get error]", error);
    return res.status(500).json({ error: "Failed to retrieve saved properties." });
  }
});

/**
 * POST /api/saved-properties
 * Save a property to the user's favorites
 */
router.post("/", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { propertyId } = req.body;

  if (!propertyId) {
    return res.status(400).json({ error: "Property ID is required." });
  }

  try {
    // 1. Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    // 2. Check if already saved
    const existing = await prisma.savedProperty.findUnique({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    if (existing) {
      return res.json({ message: "Property already saved.", saved: existing });
    }

    // 3. Create saved property entry
    const saved = await prisma.savedProperty.create({
      data: {
        userId,
        propertyId
      }
    });

    return res.status(201).json({ message: "Property saved successfully!", saved });
  } catch (error) {
    console.error("[saved property create error]", error);
    return res.status(500).json({ error: "Failed to save property." });
  }
});

/**
 * DELETE /api/saved-properties/:propertyId
 * Remove a property from the user's favorites
 */
router.delete("/:propertyId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { propertyId } = req.params;

  try {
    // Remove if exists
    await prisma.savedProperty.delete({
      where: {
        userId_propertyId: {
          userId,
          propertyId
        }
      }
    });

    return res.json({ message: "Property unsaved successfully!" });
  } catch (error: any) {
    // Check if record not found
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Property was not saved." });
    }
    console.error("[saved property delete error]", error);
    return res.status(500).json({ error: "Failed to unsave property." });
  }
});

export default router;
