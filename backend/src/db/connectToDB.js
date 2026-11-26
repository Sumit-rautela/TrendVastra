import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function connectToDB() {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log("MySQL Connected Successfully!");
  } catch (err) {
    console.log("Database connection failed:", err);
    throw err;
  }
}

export { db };
export default connectToDB;
