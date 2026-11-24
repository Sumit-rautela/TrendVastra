import { Router } from "express";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const orderRouter = Router();

//Create Order By User Route
orderRouter.post("/", verifyToken, createOrder);

//Get specific users order details
orderRouter.get("/myorders", verifyToken, getOrderById);

//get all users order details
orderRouter.get("/", verifyToken, isAdmin, getOrders);

//update order status by admin
orderRouter.put("/:id/status", verifyToken, isAdmin, updateOrderStatus);

export default orderRouter;
