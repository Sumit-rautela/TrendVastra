import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/auth.controller.js";

const authRouter = Router();

// Register Router
authRouter.post("/register", register);

//Login Router
authRouter.post("/login", login);

//Logout Router
authRouter.get("/logout", logout);

//Get current logged in user
authRouter.get("/get-me", getMe);

export default authRouter;
