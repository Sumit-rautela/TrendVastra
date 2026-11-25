import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.router.js";
import productRouter from "./routes/product.router.js";
import orderRouter from "./routes/order.router.js";
import paymentRouter from "./routes/payment.router.js";
import analyticsRouter from "./routes/analytics.router.js";
import cookieParser from "cookie-parser";
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/", (req, res) => {
  res.send("Welcome to TrendVastra API");
});

export default app;
