const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0
});

// ✅ Test DB connection
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("✅ MySQL Database Connected Successfully");
    connection.release();
  } catch (error) {
    console.error("❌ MySQL Database Connection Failed:", error.message);
  }
})();

module.exports = db;