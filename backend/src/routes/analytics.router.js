import { Router } from "express";
import { isAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import { getAdminStats } from "../controllers/analytics.controller.js";
const analyticsRouter = Router();

analyticsRouter.get("/", verifyToken, isAdmin, getAdminStats);

// analyticsRouter.post("/status/:orderId", verifyToken, isAdmin,);

export default analyticsRouter;
