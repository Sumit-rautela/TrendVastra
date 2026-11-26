import { db } from "../db/connectToDB.js";

// Get Admin Dashboard Statistics
export async function getAdminStats(req, res) {
  try {
    // Get overall statistics
    const [stats] = await db.execute(
      `SELECT
        (SELECT COUNT(*) FROM orders) AS totalOrders,

        (SELECT COUNT(*) FROM products) AS totalProducts,

        (SELECT COUNT(*) FROM users WHERE role = 'customer') AS totalCustomers,

        (SELECT COALESCE(SUM(amount), 0)
         FROM payments
         WHERE payment_status = 'success') AS totalRevenue,

        (SELECT COUNT(*) FROM orders
         WHERE status = 'pending') AS pendingOrders,

        (SELECT COUNT(*) FROM orders
         WHERE status = 'delivered') AS deliveredOrders,

        (SELECT COUNT(*) FROM orders
         WHERE status = 'cancelled') AS cancelledOrders`
    );

    // Get recent orders
    const [recentOrders] = await db.execute(
      `SELECT
        o.id AS order_id,
        o.total_amount,
        o.status,
        o.created_at,
        u.name AS customer_name,
        p.payment_method,
        p.payment_status
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN payments p ON p.order_id = o.id
       ORDER BY o.created_at DESC
       LIMIT 5`
    );

    return res.status(200).json({
      success: true,
      message: "Admin statistics fetched successfully",
      data: {
        stats: stats[0],
        recentOrders,
      },
    });
  } catch (err) {
    console.log("Admin statistics error:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
    });
  }
}
