import { db } from "../db/connectToDB.js";
import Razorpay from "razorpay";

//Create Order Controller
export async function createOrder(req, res) {
  let connection;
  let transactionStarted = false;

  try {
    const userId = req.user.id;
    const { address_id, payment_method, total_amount } = req.body;

    const allowedMethods = ["card", "upi", "netbanking", "cod"];

    // Check request body
    if (
      !Number.isInteger(Number(address_id)) ||
      Number(address_id) <= 0 ||
      !allowedMethods.includes(payment_method) ||
      total_amount == null ||
      !Number.isFinite(Number(total_amount)) ||
      Number(total_amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide valid address_id, payment_method and total_amount",
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    // Check address belongs to this user
    const [addresses] = await connection.execute(
      "SELECT id FROM addresses WHERE id = ? AND user_id = ?",
      [address_id, userId]
    );

    if (addresses.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Get cart items with current price and stock
    const [cartItems] = await connection.execute(
      `SELECT ci.product_id, ci.quantity, ci.size, p.name, p.price, p.stock_quantity
       FROM cart c
       JOIN cart_items ci ON ci.cart_id = c.id
       JOIN products p ON p.id = ci.product_id
       WHERE c.user_id = ?
       FOR UPDATE`,
      [userId]
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Check stock and calculate the real total
    let serverTotalPaise = 0;

    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${item.name}`,
        });
      }

      serverTotalPaise += Math.round(Number(item.price) * 100) * item.quantity;
    }

    const serverTotal = serverTotalPaise / 100;

    // Compare with the amount sent by frontend
    if (Math.round(Number(total_amount) * 100) !== serverTotalPaise) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(409).json({
        success: false,
        message: "Cart total has changed. Please refresh your cart.",
      });
    }

    // Create order (COD is confirmed now, online waits for payment)
    const status = payment_method === "cod" ? "confirmed" : "pending";

    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, address_id, total_amount, status)
       VALUES (?, ?, ?, ?)`,
      [userId, address_id, serverTotal, status]
    );

    const orderId = orderResult.insertId;

    // Save items and reduce stock
    for (const item of cartItems) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_id, quantity, size, price_at_purchase)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.product_id, item.quantity, item.size, item.price]
      );

      const [updateResult] = await connection.execute(
        `UPDATE products
         SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND stock_quantity >= ?`,
        [item.quantity, item.product_id, item.quantity]
      );

      if (updateResult.affectedRows !== 1) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${item.name}`,
        });
      }
    }

    // Razorpay order (online payments only)
    let razorpayOrder = null;

    if (payment_method !== "cod") {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      razorpayOrder = await razorpay.orders.create({
        amount: serverTotalPaise,
        currency: "INR",
        receipt: `order_${orderId}`,
      });
    }

    // Save payment record
    await connection.execute(
      `INSERT INTO payments
       (order_id, payment_method, payment_status, amount, gateway_order_id)
       VALUES (?, ?, 'pending', ?, ?)`,
      [
        orderId,
        payment_method,
        serverTotal,
        razorpayOrder ? razorpayOrder.id : null,
      ]
    );

    // Empty cart and save everything
    await connection.execute(
      `DELETE ci FROM cart_items ci
       JOIN cart c ON c.id = ci.cart_id
       WHERE c.user_id = ?`,
      [userId]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order_id: orderId,
        total_amount: serverTotal,
        payment_method,
        status,
        razorpay_order: razorpayOrder,
        key_id: payment_method !== "cod" ? process.env.RAZORPAY_KEY_ID : null,
      },
    });
  } catch (err) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }

    console.log("Create order error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  } finally {
    if (connection) connection.release();
  }
}

// Get All Orders Controller (Admin)
export async function getOrders(req, res) {
  try {
    // Get all orders with payment and address details
    const [orders] = await db.execute(
      `SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at,
              p.payment_method, p.payment_status,
              a.full_name, a.phone, a.street, a.city, a.state, a.pincode,
              u.name, u.email
       FROM orders o
       LEFT JOIN payments p ON p.order_id = o.id
       JOIN addresses a ON a.id = o.address_id
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    );

    // Check if orders exist
    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found",
        data: [],
      });
    }

    // Get all items of all orders
    const [items] = await db.execute(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.size,
              oi.price_at_purchase, pr.name, pi.image_url
       FROM order_items oi
       JOIN products pr ON pr.id = oi.product_id
       LEFT JOIN product_images pi
       ON pi.product_id = pr.id AND pi.is_primary = TRUE`
    );

    // Group items by order_id
    const itemsMap = new Map();

    for (const item of items) {
      if (!itemsMap.has(item.order_id)) {
        itemsMap.set(item.order_id, []);
      }

      itemsMap.get(item.order_id).push(item);
    }

    // Attach items to their respective orders
    const data = orders.map((order) => ({
      ...order,
      items: itemsMap.get(order.id) || [],
    }));

    res.status(200).json({
      success: true,
      message: "All orders fetched successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

//Get Current User Orders Controller
export async function getOrderById(req, res) {
  try {
    const userId = req.user.id;

    // Get all orders of this user with payment and address details
    const [orders] = await db.execute(
      `SELECT o.id, o.total_amount, o.status, o.created_at,
              p.payment_method, p.payment_status,
              a.full_name, a.phone, a.street, a.city, a.state, a.pincode
       FROM orders o
       JOIN payments p ON p.order_id = o.id
       JOIN addresses a ON a.id = o.address_id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    // Get all items of this user's orders with product name and primary image
    const [items] = await db.execute(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.size, oi.price_at_purchase,
              pr.name, pi.image_url
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products pr ON pr.id = oi.product_id
       LEFT JOIN product_images pi ON pi.product_id = pr.id AND pi.is_primary = TRUE
       WHERE o.user_id = ?`,
      [userId]
    );

    // Attach the items to their order
    const data = orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.id),
    }));

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found",
        data: [],
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Orders fetched successfully", data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Update Order Status Controller (Admin)
export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    // Check request body
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid order status",
      });
    }

    // Check if order exists
    const [orders] = await db.execute(
      "SELECT id, status FROM orders WHERE id = ?",
      [id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order status
    await db.execute("UPDATE orders SET status = ? WHERE id = ?", [status, id]);

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: {
        order_id: Number(id),
        previous_status: orders[0].status,
        new_status: status,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}
