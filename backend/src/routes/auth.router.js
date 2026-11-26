import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  getAllUsers,
} from "../controllers/auth.controller.js";
import { verifyToken, isAdmin } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// Register Router
authRouter.post("/register", register);

//Login Router
authRouter.post("/login", login);

//Logout Router
authRouter.get("/logout", logout);

//Get current logged in user
authRouter.get("/get-me", verifyToken, getMe);

//Get All Users
authRouter.get("/users", verifyToken, isAdmin, getAllUsers);

export default authRouter;
