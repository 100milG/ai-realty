import { Router } from "express";
import authRoutes from "./auth";
import propertiesRoutes from "./properties";
import leadsRoutes from "./leads";
import messagesRoutes from "./messages";
import kycRoutes from "./kyc";
import adminRoutes from "./admin";
import savedPropertiesRoutes from "./saved-properties";
import visitsRoutes from "./visits";
import paymentsRoutes from "./payments";
import notificationsRoutes from "./notifications";
import aiRoutes from "./ai";

const router = Router();

// Mount individual domain sub-routers
router.use("/auth", authRoutes);
router.use("/properties", propertiesRoutes);
router.use("/leads", leadsRoutes);
router.use("/messages", messagesRoutes);
router.use("/kyc", kycRoutes);
router.use("/admin", adminRoutes);
router.use("/saved-properties", savedPropertiesRoutes);
router.use("/visits", visitsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/ai", aiRoutes);

export default router;
