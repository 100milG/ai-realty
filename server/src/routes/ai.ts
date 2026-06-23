import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, authorizeRoles, AuthRequest } from "../middlewares/auth";

const router = Router();

/**
 * GET /api/ai/reports
 * Fetch AI valuation and locality reports for the logged-in user
 */
router.get("/reports", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { role } = req.user!;

  try {
    let reports;
    if (role === "ADMIN") {
      reports = await prisma.aIReport.findMany({
        include: {
          property: true,
          user: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    } else {
      reports = await prisma.aIReport.findMany({
        where: { userId },
        include: { property: true },
        orderBy: { createdAt: "desc" }
      });
    }
    return res.json(reports);
  } catch (error) {
    console.error("[ai reports get error]", error);
    return res.status(500).json({ error: "Failed to retrieve AI reports." });
  }
});

/**
 * POST /api/ai/reports/generate
 * Trigger compilation/generation of a mock AI report for a listing
 */
router.post("/reports/generate", authenticateToken, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { propertyId, type } = req.body;

  if (!propertyId || !type) {
    return res.status(400).json({ error: "Property ID and report type are required." });
  }

  try {
    // 1. Verify property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { locality: true }
    });

    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }

    // 2. Generate simulated AI insights
    const insights = {
      propertyAnalysis: {
        estimatedMarketValue: (property.price || 0) * 1.05,
        estimatedRentYield: property.price ? (property.price * 0.05) / 12 : 0,
        valuationScore: 88,
        priceTrend: "Rising (+4% past quarter)"
      },
      neighborhoodStats: {
        transitScore: 82,
        walkScore: 78,
        safetyRating: "A-",
        schoolsNearby: property.locality?.poi 
          ? (property.locality.poi as any).schools || ["District High School"] 
          : ["District High School"],
        nearestParks: property.locality?.poi 
          ? (property.locality.poi as any).parks || ["Locality Park"] 
          : ["Locality Park"]
      },
      demographics: {
        medianAge: 34,
        averageHouseholdIncome: "$95,000",
        keyGrowthIndustries: ["Tech", "Retail", "Healthcare"]
      }
    };

    // 3. Save standard AI Report entry
    const report = await prisma.aIReport.create({
      data: {
        userId,
        propertyId,
        type,
        title: `AI Intelligence Report: ${property.title}`,
        content: insights,
        status: "COMPLETED",
        fileUrl: `/reports/pdf/report_${Date.now()}.pdf`
      }
    });

    return res.status(201).json({
      message: "AI Report compiled successfully!",
      report
    });
  } catch (error) {
    console.error("[ai report generate error]", error);
    return res.status(500).json({ error: "Failed to generate AI report." });
  }
});

/**
 * GET /api/ai/recommendations
 * Retrieve personalized property recommendations matching customer preference tags
 */
router.get("/recommendations", authenticateToken, authorizeRoles("CUSTOMER"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    // 1. Get user preferences
    const userPref = await prisma.customerPreference.findUnique({
      where: { userId }
    });

    // 2. Fetch active recommendation entries
    let recommendations = await prisma.propertyRecommendation.findMany({
      where: { userId },
      include: {
        property: {
          include: { locality: true, media: true }
        }
      },
      orderBy: { score: "desc" }
    });

    // 3. Fallback: If no static recommendation rows exist, calculate some dynamically and save them
    if (recommendations.length === 0) {
      const activeProperties = await prisma.property.findMany({
        where: { status: "ACTIVE" },
        include: { locality: true, media: true }
      });

      // Simple scoring model matching price, type, or beds
      const preferenceObj = userPref ? (userPref.preferences as any) : {};
      const maxPrice = preferenceObj.maxPrice || 1000000;
      const preferredType = preferenceObj.propertyType;

      const scored = activeProperties.map(p => {
        let score = 50.0; // base score

        if (p.price && p.price <= maxPrice) {
          score += 25.0; // matches price budget
        } else if (p.price) {
          const over = (p.price - maxPrice) / maxPrice;
          score -= Math.min(25.0, over * 10.0); // penalize going over budget
        }

        if (preferredType && p.propertyType === preferredType) {
          score += 25.0; // matches type
        }

        return {
          propertyId: p.id,
          score: parseFloat(score.toFixed(1)),
          explanation: `Matches price budget (~$${maxPrice.toLocaleString()}) and preferred layout tags.`
        };
      });

      // Sort scored, pick top 5
      scored.sort((a, b) => b.score - a.score);
      const topScored = scored.slice(0, 5);

      // Save to database
      if (topScored.length > 0) {
        await prisma.propertyRecommendation.createMany({
          data: topScored.map(rec => ({
            userId,
            propertyId: rec.propertyId,
            score: rec.score,
            explanation: rec.explanation
          }))
        });

        // Re-query with includes
        recommendations = await prisma.propertyRecommendation.findMany({
          where: { userId },
          include: {
            property: {
              include: { locality: true, media: true }
            }
          },
          orderBy: { score: "desc" }
        });
      }
    }

    return res.json(recommendations);
  } catch (error) {
    console.error("[ai recommendations error]", error);
    return res.status(500).json({ error: "Failed to retrieve personalized recommendations." });
  }
});

/**
 * PUT /api/ai/preferences
 * Save/update search preferences metadata for the customer
 */
router.put("/preferences", authenticateToken, authorizeRoles("CUSTOMER"), async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { preferences } = req.body;

  if (!preferences || typeof preferences !== "object") {
    return res.status(400).json({ error: "Preferences payload object is required." });
  }

  try {
    // Update or create preference metadata
    const userPref = await prisma.customerPreference.upsert({
      where: { userId },
      update: {
        preferences,
        updatedAt: new Date()
      },
      create: {
        userId,
        preferences
      }
    });

    // Wipe old computed recommendations to trigger recalculation on next fetch
    await prisma.propertyRecommendation.deleteMany({
      where: { userId }
    });

    return res.json({
      message: "Customer preferences stored! Recommendations list refreshed.",
      preferences: userPref
    });
  } catch (error) {
    console.error("[ai preferences put error]", error);
    return res.status(500).json({ error: "Failed to store user preferences." });
  }
});

export default router;
