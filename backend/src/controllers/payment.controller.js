import { db } from "../db/connectToDB.js";
import crypto from "crypto";
import Razorpay from "razorpay";

export async function verifyPayment(req, res) {
  let connection;

  try {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Check request body
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message:
          "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    // Create the signature on our server
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Verify actual payment with Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      razorpayPayment.order_id !== razorpay_order_id ||
      razorpayPayment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or payment details are invalid",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // Find the payment and check user ownership
    const [payments] = await connection.execute(
      `SELECT p.id, p.order_id, p.payment_status, p.amount
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE p.gateway_order_id = ? AND o.user_id = ?
       FOR UPDATE`,
      [razorpay_order_id, userId]
    );

    if (payments.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = payments[0];

    // If already verified
    if (payment.payment_status === "success") {
      await connection.rollback();

      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        data: { order_id: payment.order_id },
      });
    }

    // Check payment amount and currency
    if (
      razorpayPayment.amount !== Math.round(Number(payment.amount) * 100) ||
      razorpayPayment.currency !== "INR"
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Payment amount or currency mismatch",
      });
    }

    // Mark payment as success
    await connection.execute(
      `UPDATE payments
       SET payment_status = 'success', transaction_id = ?, paid_at = NOW()
       WHERE id = ?`,
      [razorpay_payment_id, payment.id]
    );

    // Confirm the order
    await connection.execute(
      "UPDATE orders SET status = 'confirmed' WHERE id = ?",
      [payment.order_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        order_id: payment.order_id,
        transaction_id: razorpay_payment_id,
      },
    });
  } catch (err) {
    if (connection) await connection.rollback();

    console.log("Payment verification error:", err);

    return res.status(500).json({
      success: false,
      message: "Payment verification failed",
    });
  } finally {
    if (connection) connection.release();
  }
}
