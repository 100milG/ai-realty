import { Router, Response } from "express";
import { prisma } from "../db";
import { authenticateToken, authorizeRoles, AuthRequest } from "../middlewares/auth";
import { Role, PropertyStatus, KYCStatus } from "@prisma/client";

const router = Router();

/**
 * GET /api/admin/stats
 * Retrieve platform-wide metrics and activity log (Restricted to ADMIN)
 */
router.get("/stats", authenticateToken, authorizeRoles("ADMIN"), async (req: AuthRequest, res: Response) => {
  try {
    // 1. Fetch counts
    const totalUsers = await prisma.user.count();
    const totalProperties = await prisma.property.count();
    const totalSubagents = await prisma.user.count({
      where: { role: Role.SUBAGENT }
    });
    
    const pendingProperties = await prisma.property.count({
      where: { status: PropertyStatus.PENDING_APPROVAL }
    });
    const pendingKYC = await prisma.kYCVerification.count({
      where: { status: KYCStatus.PENDING }
    });
    const totalPendingApprovals = pendingProperties + pendingKYC;

    // 2. Fetch property approval status breakdowns
    const approvedProps = await prisma.property.count({ where: { status: PropertyStatus.ACTIVE } });
    const pendingProps = await prisma.property.count({ where: { status: PropertyStatus.PENDING_APPROVAL } });
    const rejectedProps = await prisma.property.count({ where: { status: PropertyStatus.REJECTED } });

    // 3. Fetch recent entities for activity log
    const recentProps = await prisma.property.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        agents: {
          include: {
            subagent: { select: { name: true } }
          }
        }
      }
    });

    const recentKYC = await prisma.kYCVerification.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } }
      }
    });

    const recentLeads = await prisma.lead.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        property: { select: { title: true } }
      }
    });

    // 4. Merge and format activities
    const activities: any[] = [];

    recentProps.forEach(p => {
      const agentName = p.agents?.[0]?.subagent?.name || "Agent";
      activities.push({
        type: "property_moderation",
        message: `Property '${p.title}' submitted by ${agentName}`,
        time: p.createdAt
      });
    });

    recentKYC.forEach(k => {
      activities.push({
        type: "subagent_approval",
        message: `New subagent KYC documents uploaded by ${k.user.name}`,
        time: k.createdAt
      });
    });

    recentLeads.forEach(l => {
      activities.push({
        type: "lead_created",
        message: `New lead: ${l.customer?.name || "Customer"} expressed interest in '${l.property?.title || "Property"}'`,
        time: l.createdAt
      });
    });

    // Sort combined activities by time desc, take top 6
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const topActivities = activities.slice(0, 6);

    // 5. Gather pending approval list items
    const pendingItems: any[] = [];
    
    const pendingPropertiesList = await prisma.property.findMany({
      where: { status: PropertyStatus.PENDING_APPROVAL },
      take: 3,
      orderBy: { createdAt: "desc" }
    });

    const pendingKYCList = await prisma.kYCVerification.findMany({
      where: { status: KYCStatus.PENDING },
      take: 3,
      include: { user: true },
      orderBy: { createdAt: "desc" }
    });

    pendingPropertiesList.forEach(p => {
      pendingItems.push({
        type: "Property",
        name: `${p.title} - ₹${p.price?.toLocaleString() || "N/A"}`,
        submitted: p.createdAt
      });
    });

    pendingKYCList.forEach(k => {
      pendingItems.push({
        type: "Subagent",
        name: k.user.name,
        submitted: k.createdAt
      });
    });

    pendingItems.sort((a, b) => new Date(b.submitted).getTime() - new Date(a.submitted).getTime());

    return res.json({
      stats: {
        totalUsers,
        totalProperties,
        totalSubagents,
        totalPendingApprovals
      },
      statusData: [
        { name: "Approved", value: approvedProps, color: "#10B981" },
        { name: "Pending", value: pendingProps, color: "#F59E0B" },
        { name: "Rejected", value: rejectedProps, color: "#EF4444" }
      ],
      recentActivity: topActivities,
      pendingApprovals: pendingItems.slice(0, 5)
    });
  } catch (error) {
    console.error("[admin stats error]", error);
    return res.status(500).json({ error: "Failed to retrieve admin stats." });
  }
});

export default router;
