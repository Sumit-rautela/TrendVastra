import { Router } from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { verifyPayment } from "../controllers/payment.controller.js";

const paymentRouter = Router();

// Called by frontend right after the user pays in the Razorpay popup
paymentRouter.post("/verify", verifyToken, verifyPayment);

export default paymentRouter;
