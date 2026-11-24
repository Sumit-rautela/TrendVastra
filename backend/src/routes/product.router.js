import { Router } from "express";
import { isAdmin, verifyToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const productRouter = Router();

//Get all products
productRouter.get("/", getProducts);

//Create New Product
productRouter.post(
  "/",
  verifyToken,
  isAdmin,
  upload.array("images", 5),
  createProduct
);

//Get specific Product using ID
productRouter.get("/:id", getProductById);

//Update specific product using ID
productRouter.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.array("images", 5),
  updateProduct
);

//Delete specific product using ID
productRouter.delete("/:id", verifyToken, isAdmin, deleteProduct);

export default productRouter;
